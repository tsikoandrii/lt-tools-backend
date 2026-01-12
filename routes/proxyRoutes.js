const router = require('express').Router();
const proxyController = require('../controllers/proxyController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Proxy:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         ip:
 *           type: string
 *         port:
 *           type: integer
 *         username:
 *           type: string
 *           nullable: true
 *         password:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [ACTIVE, DEAD]
 *         facebookAccountId:
 *           type: integer
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         facebookAccount:
 *           $ref: '#/components/schemas/FacebookAccount'
 */

/**
 * @swagger
 * /proxies:
 *   post:
 *     summary: Create a proxy (with automatic check)
 *     tags: [Proxies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ip
 *               - port
 *             properties:
 *               ip:
 *                 type: string
 *                 example: "192.168.1.1"
 *               port:
 *                 type: integer
 *                 example: 8080
 *               username:
 *                 type: string
 *                 example: "proxyuser"
 *               password:
 *                 type: string
 *                 example: "proxypass"
 *               autoCheck:
 *                 type: boolean
 *                 example: true
 *                 description: Automatically check proxy on creation
 *     responses:
 *       200:
 *         description: Proxy created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proxy:
 *                   $ref: '#/components/schemas/Proxy'
 *                 checkResult:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     ip:
 *                       type: string
 *                     responseTime:
 *                       type: integer
 *                     status:
 *                       type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, proxyController.addProxy);

/**
 * @swagger
 * /proxies:
 *   get:
 *     summary: Get all proxies
 *     tags: [Proxies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, DEAD]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of proxies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Proxy'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, proxyController.getProxies);

/**
 * @swagger
 * /proxies/check-all:
 *   post:
 *     summary: Check all proxies
 *     tags: [Proxies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Check results for all proxies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 alive:
 *                   type: integer
 *                 dead:
 *                   type: integer
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       proxyId:
 *                         type: integer
 *                       ip:
 *                         type: string
 *                       port:
 *                         type: integer
 *                       success:
 *                         type: boolean
 *                       responseTime:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/check-all', authMiddleware, proxyController.checkAllProxies);

/**
 * @swagger
 * /proxies/{id}/check:
 *   post:
 *     summary: Check a single proxy
 *     tags: [Proxies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proxy ID
 *     responses:
 *       200:
 *         description: Proxy check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proxy:
 *                   $ref: '#/components/schemas/Proxy'
 *                 checkResult:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     ip:
 *                       type: string
 *                     responseTime:
 *                       type: integer
 *                     status:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Proxy not found
 *       500:
 *         description: Server error
 */
router.post('/:id/check', authMiddleware, proxyController.checkProxy);

/**
 * @swagger
 * /proxies/{id}/link:
 *   patch:
 *     summary: Link a proxy to a Facebook account
 *     tags: [Proxies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proxy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facebookAccountId
 *             properties:
 *               facebookAccountId:
 *                 type: integer
 *                 example: 1
 *                 description: Facebook account ID to link to
 *     responses:
 *       200:
 *         description: Proxy linked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proxy'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Proxy not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/link', authMiddleware, proxyController.linkProxy);

/**
 * @swagger
 * /proxies/{id}:
 *   put:
 *     summary: Update proxy data
 *     tags: [Proxies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proxy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ip:
 *                 type: string
 *                 example: "192.168.1.2"
 *               port:
 *                 type: integer
 *                 example: 8080
 *               username:
 *                 type: string
 *                 example: "newuser"
 *               password:
 *                 type: string
 *                 example: "newpass"
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DEAD]
 *                 example: "ACTIVE"
 *     responses:
 *       200:
 *         description: Proxy updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proxy'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Proxy not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, proxyController.updateProxy);

/**
 * @swagger
 * /proxies/{id}:
 *   delete:
 *     summary: Delete proxy
 *     tags: [Proxies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Proxy ID
 *     responses:
 *       200:
 *         description: Proxy deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Proxy deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Proxy not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, proxyController.deleteProxy);

module.exports = router;