const { PrismaClient } = require('@prisma/client');
const facebookService = require("../services/facebookService");
const prisma = new PrismaClient();
// GET /ad-accounts
exports.getAdAccounts = async (req, res, next) => {
  try {
    const adAccounts = await prisma.adAccount.findMany({
      where: req.user.role === 'SUPERADMIN'
        ? {}
        : {
            facebookAccount: {
              userId: req.user.id
            }
          },
      include: { facebookAccount: true }
    });

    res.json(adAccounts);
  } catch (err) {
    next(err);
  }
};

// POST /ad-accounts
exports.createAdAccount = async (req, res, next) => {
  const { facebookAccountId, adAccountId, name, businessId, currency, timezone, hasCard, hasPixel } = req.body;

  try {
    const facebookAccount = await prisma.facebookAccount.findUnique({
      where: { id: facebookAccountId }
    });

    if (!facebookAccount) {
      return res.status(404).json({ message: 'Facebook account not found' });
    }

    const isOwner = facebookAccount.userId === req.user.id;
    if (req.user.role !== 'SUPERADMIN' && !isOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const adAccount = await prisma.adAccount.create({
      data: {
        facebookAccountId,
        adAccountId,
        name,
        businessId,
        currency,
        timezone,
        status: 'ACTIVE',
        hasCard: hasCard || false,
        hasPixel: hasPixel || false
      }
    });

    res.status(201).json(adAccount);
  } catch (err) {
    next(err);
  }
};

// DELETE /ad-accounts/:id
exports.deleteAdAccount = async (req, res, next) => {
  const adAccountId = parseInt(req.params.id);

  try {
    const adAccount = await prisma.adAccount.findUnique({
      where: { id: adAccountId },
      include: { facebookAccount: true }
    });

    if (!adAccount) return res.status(404).json({ message: 'AdAccount not found' });

    const isOwner = adAccount.facebookAccount.userId === req.user.id;
    if (req.user.role !== 'SUPERADMIN' && !isOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.adAccount.delete({
      where: { id: adAccountId }
    });

    res.json({ message: 'AdAccount deleted' });
  } catch (err) {
    next(err);
  }
};

// PATCH /ad-accounts/:id
exports.updateAdAccount = async (req, res, next) => {
  const adAccountId = parseInt(req.params.id);
  const { name, notifications, hasCard, hasPixel } = req.body;

  try {
    const adAccount = await prisma.adAccount.findUnique({
      where: { id: adAccountId },
      include: { facebookAccount: true }
    });

    if (!adAccount) return res.status(404).json({ message: 'AdAccount not found' });

    const isOwner = adAccount.facebookAccount.userId === req.user.id;
    if (req.user.role !== 'SUPERADMIN' && !isOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await prisma.adAccount.update({
      where: { id: adAccountId },
      data: {
        name,
        notifications,
        hasCard,
        hasPixel
      }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// PATCH /ad-accounts/:id/auto-commenting
exports.toggleAutoCommenting = async (req, res, next) => {
  const adAccountId = parseInt(req.params.id);
  const { enabled } = req.body;

  try {
    const adAccount = await prisma.adAccount.findUnique({
      where: { id: adAccountId },
      include: { facebookAccount: true }
    });

    if (!adAccount) return res.status(404).json({ message: 'AdAccount not found' });

    const isOwner = adAccount.facebookAccount.userId === req.user.id;
    if (req.user.role !== 'SUPERADMIN' && !isOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await prisma.adAccount.update({
      where: { id: adAccountId },
      data: {
        autoCommenting: enabled
      }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// PATCH /ad-accounts/bulk
exports.bulkUpdate = async (req, res, next) => {
  const { ids, data } = req.body;

  try {
    const updatedAccounts = await prisma.adAccount.updateMany({
      where: {
        id: { in: ids }
      },
      data
    });

    res.json({ updated: updatedAccounts.count });
  } catch (err) {
    next(err);
  }
};

exports.getActiveAds = async (req, res, next) => {
  try {
    const adAccountDbId = parseInt(req.params.id);

    const adAccount = await prisma.adAccount.findUnique({
      where: { id: adAccountDbId },
      include: { facebookAccount: { include: { Proxy: true } } }
    });

    if (!adAccount) {
      return res.status(404).json({ message: "AdAccount not found" });
    }

    const fbAccount = adAccount.facebookAccount;

    if (req.user.role !== 'SUPERADMIN' && fbAccount.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const accessToken = fbAccount.accessToken;
    const proxy = fbAccount.Proxy || null;

    const realAdAccountId = adAccount.adAccountId;

    const ads = await facebookService.getActiveAds(
      accessToken,
      proxy,
      realAdAccountId
    );

    res.json({
      adAccountId: realAdAccountId,
      count: ads?.data?.length || 0,
      ads: ads.data
    });

  } catch (err) {
    next(err);
  }
};

exports.getAdsWithPostInfo = async (req, res, next) => {
  try {
    const adAccountDbId = parseInt(req.params.id);

    const adAccount = await prisma.adAccount.findUnique({
      where: { id: adAccountDbId },
      include: { facebookAccount: { include: { Proxy: true } } }
    });

    if (!adAccount) {
      return res.status(404).json({ message: "AdAccount not found" });
    }

    const fbAccount = adAccount.facebookAccount;

    if (req.user.role !== "SUPERADMIN" && fbAccount.userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const accessToken = fbAccount.accessToken;   // ⬅️ аналогічно твоєму сервісу
    const proxy = fbAccount.Proxy || null;

    const realAdAccountId = adAccount.adAccountId;

    const ads = await facebookService.getAdsWithPostInfo(
      accessToken,
      proxy,
      realAdAccountId
    );

    res.json({
      adAccountId: realAdAccountId,
      count: ads.length,
      ads
    });

  } catch (err) {
    next(err);
  }
};


