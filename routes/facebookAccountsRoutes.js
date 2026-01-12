const router = require('express').Router();
const controller = require('../controllers/facebookAccountsController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     FacebookAccount:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         name:
 *           type: string
 *         fbUserId:
 *           type: string
 *         accessToken:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ACTIVE, CHECKPOINT, BANNED]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         adAccounts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdAccount'
 *         proxy:
 *           $ref: '#/components/schemas/Proxy'
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
 *         password:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ACTIVE, DEAD]
 *         facebookAccountId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProxyInput:
 *       type: object
 *       required:
 *         - ip
 *         - port
 *       properties:
 *         ip:
 *           type: string
 *           description: Proxy IP address
 *           example: "192.168.1.1"
 *         port:
 *           type: integer
 *           description: Proxy port
 *           example: 8080
 *         username:
 *           type: string
 *           description: Proxy username (optional)
 *         password:
 *           type: string
 *           description: Proxy password (optional)
 *         status:
 *           type: string
 *           enum: [ACTIVE, DEAD]
 *           default: DEAD
 */
/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Add Facebook account via access token with optional proxy
 *     tags: [FacebookAccounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Facebook access token
 *               proxyId:
 *                 type: integer
 *                 description: Existing proxy ID
 *                 example: 1
 *               autoAssignProxy:
 *                 type: boolean
 *                 default: false
 *                 description: Automatically assign free proxy if no proxyId provided
 *           examples:
 *             withProxyId:
 *               summary: Add account with existing proxy
 *               value:
 *                 accessToken: "EAABwzLixnjYBO..."
 *                 proxyId: 5
 *             autoProxy:
 *               summary: Add account with auto-assigned proxy
 *               value:
 *                 accessToken: "EAABwzLixnjYBO..."
 *                 autoAssignProxy: true
 *             noProxy:
 *               summary: Add account without proxy
 *               value:
 *                 accessToken: "EAABwzLixnjYBO..."
 *
 *     responses:
 *       201:
 *         description: Facebook account added successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/FacebookAccount'
 *                 - type: object
 *                   properties:
 *                     proxy:
 *                       $ref: '#/components/schemas/Proxy'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid access token"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Get all user Facebook accounts with proxies
 *     tags: [FacebookAccounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Facebook accounts with proxy information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/FacebookAccount'
 *                   - type: object
 *                     properties:
 *                       proxy:
 *                         $ref: '#/components/schemas/Proxy'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /accounts/{id}:
 *   put:
 *     summary: Update Facebook account
 *     tags: [FacebookAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Facebook account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               accessToken:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, CHECKPOINT, BANNED]
 *     responses:
 *       200:
 *         description: Facebook account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FacebookAccount'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /accounts/{id}:
 *   patch:
 *     summary: Partially update Facebook account
 *     tags: [FacebookAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Facebook account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               accessToken:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, CHECKPOINT, BANNED]
 *     responses:
 *       200:
 *         description: Facebook account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FacebookAccount'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /accounts/{id}:
 *   delete:
 *     summary: Delete Facebook account
 *     tags: [FacebookAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Facebook account ID
 *     responses:
 *       200:
 *         description: Facebook account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Account deleted"
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /accounts/{id}/ad-accounts:
 *   get:
 *     summary: Get all ad accounts linked to FB account
 *     tags: [FacebookAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Facebook account ID
 *     responses:
 *       200:
 *         description: List of ad accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdAccount'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /accounts/{id}/ad-accounts/refresh:
 *   put:
 *     summary: Refresh ad accounts from Facebook API and sync with local DB
 *     tags: [FacebookAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Facebook account ID
 *     responses:
 *       200:
 *         description: Ad accounts successfully synced
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ad accounts refreshed"
 *                 adAccounts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdAccount'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Account not found
 *       500:
 *         description: Server error
 */


router.post('/', authMiddleware, controller.addAccount);
router.get('/', authMiddleware, controller.getAccounts);
router.put('/:id', authMiddleware, controller.updateAccount);
router.patch('/:id', authMiddleware, controller.patchAccount);
router.delete('/:id', authMiddleware, controller.deleteAccount);
router.get('/:id/ad-accounts', authMiddleware, controller.getAdAccounts);
router.put('/:id/ad-accounts/refresh', authMiddleware, controller.refreshAdAccounts);

module.exports = router;