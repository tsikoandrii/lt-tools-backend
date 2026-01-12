const facebookService = require('../services/facebookService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.addAccount = async (req, res, next) => {
  const userId = req.user.userId;

  const { accessToken, proxyId, autoAssignProxy = false } = req.body;

  try {
    let proxy = null;

    // Если прокси явно указан
    if (proxyId) {
      proxy = await prisma.proxy.findUnique({ where: { id: proxyId } });

      if (!proxy) {
        throw new Error(`Proxy with ID ${proxyId} not found`);
      }

      if (proxy.facebookAccountId) {
        throw new Error(`Proxy with ID ${proxyId} is already linked to another account`);
      }
    }

    // Если включено авто-назначение и прокси ещё нет
    if (!proxy && autoAssignProxy) {
      proxy = await prisma.proxy.findFirst({
        where: {
          facebookAccountId: null,
          status: 'ACTIVE'
        }
      });

      if (!proxy) {
        throw new Error(`No free active proxies available`);
      }
    }

    // Ходим к Facebook уже через выбранный прокси (если есть)
    const fbUser = await facebookService.getMe(accessToken, proxy);
    const fbAdAccounts = await facebookService.getAdAccounts(accessToken, proxy);

    // Используем транзакцию для атомарности
    const result = await prisma.$transaction(async (tx) => {
      // Создаем/обновляем Facebook аккаунт
      let account = await tx.facebookAccount.upsert({
        where: { fbUserId: fbUser.id },
        update: { accessToken, name: fbUser.name },
        create: {
          userId,
          fbUserId: fbUser.id,
          name: fbUser.name,
          accessToken
        }
      });

      // Привязка прокси к аккаунту (если выбран)
      if (proxy) {
        const updatedProxy = await tx.proxy.update({
          where: { id: proxy.id },
          data: { facebookAccountId: account.id }
        });
        account.proxy = updatedProxy;
      }

      // Создаем/обновляем рекламные аккаунты
      for (const ad of fbAdAccounts.data) {
        await tx.adAccount.upsert({
          where: { adAccountId: ad.id },
          update: {
            name: ad.name,
            status: mapStatus(ad.account_status),
            currency: ad.currency,
            timezone: ad.timezone_name,
            businessId: ad.business?.id ?? null
          },
          create: {
            facebookAccountId: account.id,
            adAccountId: ad.id,
            name: ad.name,
            status: mapStatus(ad.account_status),
            currency: ad.currency,
            timezone: ad.timezone_name,
            businessId: ad.business?.id ?? null,
            hasCard: false,
            hasPixel: false
          }
        });
      }

      return account;
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};


exports.getAccounts = async (req, res, next) => {
  const user = req.user;
  const where = user.role === 'SUPERADMIN' ? {} : { userId: user.id };

  const accounts = await prisma.facebookAccount.findMany({
    where,
    include: { Proxy: true }
  }); res.json(accounts);
};

// PUT /accounts/:id
exports.updateAccount = async (req, res, next) => {
  const accountId = parseInt(req.params.id);
  const { name, accessToken, status } = req.body;

  try {
    const account = await prisma.facebookAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) return res.status(404).json({ message: 'Account not found' });

    if (req.user.role !== 'SUPERADMIN' && account.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await prisma.facebookAccount.update({
      where: { id: accountId },
      data: { name, accessToken, status }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// PATCH /accounts/:id
exports.patchAccount = async (req, res, next) => {
  try {
    const accountId = Number(req.params.id);
    const { name, fbUserId, accessToken, status, Proxy } = req.body;

    const account = await prisma.facebookAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (req.user.role !== 'SUPERADMIN' && account.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    let finalStatus = account.status;
    let proxyData = null;

    if (Proxy) {
      proxyData = await prisma.proxy.findUnique({ where: { id: Proxy } });
      if (!proxyData) {
        return res.status(400).json({ error: 'Proxy not found' });
      }
    }

    if (accessToken) {
      try {
        const profile = await facebookService.getMe(accessToken, proxyData);
        if (profile.id) {
          finalStatus = 'ACTIVE';
        }
      } catch (err) {
        finalStatus = 'INACTIVE';
      }
    }

    if (proxyData && proxyData.status !== 'ACTIVE') {
      finalStatus = 'INACTIVE';
    }

    const dataToUpdate = {
      name,
      fbUserId,
      accessToken,
      status: finalStatus,
    };

    if (proxyData) {
      dataToUpdate.Proxy = { connect: { id: proxyData.id } };
    }

    const updated = await prisma.facebookAccount.update({
      where: { id: accountId },
      data: dataToUpdate,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /accounts/:id
exports.deleteAccount = async (req, res, next) => {
  const accountId = parseInt(req.params.id);

  try {
    const account = await prisma.facebookAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) return res.status(404).json({ message: 'Account not found' });

    if (req.user.role !== 'SUPERADMIN' && account.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    await prisma.adAccount.deleteMany({
      where: { facebookAccountId: accountId }
    });

    await prisma.commentTask.deleteMany({
      where: { facebookAccountId: accountId }
    });

    await prisma.facebookAccount.delete({
      where: { id: accountId }
    });

    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getAdAccounts = async (req, res, next) => {
  const accountId = parseInt(req.params.id);
  const account = await prisma.facebookAccount.findUnique({
    where: { id: accountId },
    include: { adAccounts: true }
  });

  if (!account) return res.status(404).json({ message: 'Account not found' });

  if (req.user.role !== 'SUPERADMIN' && account.userId !== req.user.id)
    return res.status(403).json({ message: 'Forbidden' });

  res.json(account.adAccounts);
};

exports.refreshAdAccounts = async (req, res, next) => {
    try {
        const accountId = parseInt(req.params.id);

        // Находим FB аккаунт
        const account = await prisma.facebookAccount.findUnique({
            where: { id: accountId },
            include: { Proxy: true }
        });

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        // Проверка прав
        if (req.user.role !== 'SUPERADMIN' && account.userId !== account.userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const accessToken = account.accessToken;
        const proxy = account.Proxy || null;

        // Получаем рекламные аккаунты с Facebook API
        const fbAdAccounts = await facebookService.getAdAccounts(accessToken, proxy);

        // Обновляем/создаем рекламные аккаунты
        const updated = await prisma.$transaction(async (tx) => {
            const results = [];

            for (const ad of fbAdAccounts.data) {
                const item = await tx.adAccount.upsert({
                    where: { adAccountId: ad.id },
                    update: {
                        name: ad.name,
                        status: mapStatus(ad.account_status),
                        currency: ad.currency,
                        timezone: ad.timezone_name,
                        businessId: ad.business?.id ?? null
                    },
                    create: {
                        facebookAccountId: account.id,
                        adAccountId: ad.id,
                        name: ad.name,
                        status: mapStatus(ad.account_status),
                        currency: ad.currency,
                        timezone: ad.timezone_name,
                        businessId: ad.business?.id ?? null,
                        hasCard: false,
                        hasPixel: false
                    }
                });

                results.push(item);
            }

            return results;
        });

        res.json({ message: "Ad accounts refreshed", adAccounts: updated });

    } catch (err) {
        next(err);
    }
};


function mapStatus(apiStatus) {
  const statusMap = {
    1: 'ACTIVE',
    2: 'GRACE',
    3: 'CLOSED',
    7: 'BLOCKED'
  };
  return statusMap[apiStatus] || 'BLOCKED';
}
