const { PrismaClient, ProxyStatus } = require('@prisma/client');
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
const prisma = new PrismaClient();

/**
 * Проверка работоспособности прокси (socks5)
 */
async function checkProxyConnection(ip, port, username, password, timeout = 10000) {
  try {
    const proxyUrl = username && password
      ? `socks5h://${username}:${password}@${ip}:${port}`
      : `socks5h://${ip}:${port}`;

    const agent = new SocksProxyAgent(proxyUrl);

    const startTime = Date.now();

    const response = await axios.get('https://api.ipify.org?format=json', {
      httpsAgent: agent,
      httpAgent: agent,
      timeout: timeout,
      validateStatus: (status) => status === 200
    });

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      ip: response.data.ip,
      responseTime,
      status: ProxyStatus.ACTIVE
    };

  } catch (error) {
    console.error('Proxy check error:', error.message);

    return {
      success: false,
      error: error.message,
      status: ProxyStatus.DEAD
    };
  }
}

module.exports = {
  /**
   * Добавление прокси с автоматической проверкой
   */
  async addProxy(req, res) {
    try {
      const { ip, port, username, password, autoCheck = true } = req.body;

      if (!ip || !port || !username || !password) {
        return res.status(400).json({ error: "Please provide all required fields: ip, port, username, password" });
      }

      let status = ProxyStatus.DEAD;
      let checkResult = null;

      if (autoCheck) {
        checkResult = await checkProxyConnection(ip, port, username, password);
        status = checkResult.status;
      }

      const proxy = await prisma.proxy.create({
        data: {
          ip,
          port,
          username,
          password,
          status
        }
      });

      res.json({
        proxy,
        checkResult: autoCheck ? checkResult : null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Проверка одного прокси
   */
  async checkProxy(req, res) {
    try {
      const { id } = req.params;

      const proxy = await prisma.proxy.findUnique({
        where: { id: Number(id) }
      });

      if (!proxy) {
        return res.status(404).json({ error: 'Proxy not found' });
      }

      // Проверяем прокси
      const checkResult = await checkProxyConnection(
        proxy.ip,
        proxy.port,
        proxy.username,
        proxy.password
      );

      // Обновляем статус в базе
      const updatedProxy = await prisma.proxy.update({
        where: { id: Number(id) },
        data: {
          status: checkResult.status,
          lastChecked: new Date()
        }
      });

      res.json({
        proxy: updatedProxy,
        checkResult
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Проверка всех прокси
   */
  async checkAllProxies(req, res) {
    try {
      const proxies = await prisma.proxy.findMany();
      
      const results = [];
      
      // Проверяем прокси по 5 одновременно для оптимизации
      const concurrency = 5;
      for (let i = 0; i < proxies.length; i += concurrency) {
        const batch = proxies.slice(i, i + concurrency);
        
        const batchResults = await Promise.all(
          batch.map(async (proxy) => {
            const checkResult = await checkProxyConnection(
              proxy.ip,
              proxy.port,
              proxy.username,
              proxy.password
            );

            // Обновляем статус в базе
            await prisma.proxy.update({
              where: { id: proxy.id },
              data: {
                status: checkResult.status,
                lastChecked: new Date()
              }
            });

            return {
              proxyId: proxy.id,
              ip: proxy.ip,
              port: proxy.port,
              ...checkResult
            };
          })
        );
        
        results.push(...batchResults);
      }

      const aliveCount = results.filter(r => r.success).length;
      const deadCount = results.filter(r => !r.success).length;

      res.json({
        total: proxies.length,
        alive: aliveCount,
        dead: deadCount,
        results
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Привязка прокси к аккаунту
   */
  async linkProxy(req, res) {
    try {
      const { id } = req.params;
      const { facebookAccountId } = req.body;

      const proxy = await prisma.proxy.update({
        where: { id: Number(id) },
        data: { facebookAccountId }
      });

      res.json(proxy);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Получение всех прокси
   */
  async getProxies(req, res) {
    try {
      const { status } = req.query;
      
      const where = status ? { status } : {};
      
      const proxies = await prisma.proxy.findMany({
        where,
        include: {
          facebookAccount: true
        }
      });
      
      res.json(proxies);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Обновление прокси
   */
  async updateProxy(req, res) {
    try {
      const { id } = req.params;
      const { ip, port, username, password, status } = req.body;

      const proxy = await prisma.proxy.update({
        where: { id: Number(id) },
        data: {
          ip,
          port,
          username,
          password,
          status
        }
      });

      res.json(proxy);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Удаление прокси
   */
  async deleteProxy(req, res) {
    try {
      const { id } = req.params;

      await prisma.proxy.delete({
        where: { id: Number(id) }
      });

      res.json({ message: 'Proxy deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};