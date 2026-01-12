const router = require('express').Router();
const controller = require('../controllers/adAccountsController');
const authMiddleware = require('../middlewares/authMiddleware');
/**
 * @swagger
 * components:
 *   schemas:
 *     AdAccount:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         facebookAccountId:
 *           type: integer
 *         adAccountId:
 *           type: string
 *         name:
 *           type: string
 *         businessId:
 *           type: string
 *           nullable: true
 *         currency:
 *           type: string
 *           nullable: true
 *         timezone:
 *           type: string
 *           nullable: true
 *         country:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [ACTIVE, GRACE, CLOSED, BLOCKED]
 *         hasCard:
 *           type: boolean
 *         hasPixel:
 *           type: boolean
 *         notifications:
 *           type: boolean
 *         autoCommenting:
 *           type: boolean
 *         facebookAccount:
 *           $ref: '#/components/schemas/FacebookAccount'
 */

/**
 * @swagger
 * /ad-accounts:
 *   get:
 *     summary: Get all ad accounts (filtered by role)
 *     tags: [AdAccounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of ad accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdAccount'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /ad-accounts:
 *   post:
 *     summary: Create a new ad account
 *     tags: [AdAccounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facebookAccountId
 *               - adAccountId
 *               - name
 *             properties:
 *               facebookAccountId:
 *                 type: integer
 *               adAccountId:
 *                 type: string
 *               name:
 *                 type: string
 *               businessId:
 *                 type: string
 *               currency:
 *                 type: string
 *               timezone:
 *                 type: string
 *               hasCard:
 *                 type: boolean
 *                 default: false
 *               hasPixel:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Ad account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdAccount'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Facebook account not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /ad-accounts/{id}:
 *   patch:
 *     summary: Update ad account info
 *     tags: [AdAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ad account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               notifications:
 *                 type: boolean
 *               hasCard:
 *                 type: boolean
 *               hasPixel:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Ad account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdAccount'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ad account not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /ad-accounts/{id}/auto-commenting:
 *   patch:
 *     summary: Toggle auto-commenting
 *     tags: [AdAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ad account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Auto-commenting toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdAccount'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ad account not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /ad-accounts/bulk:
 *   patch:
 *     summary: Bulk update ad accounts
 *     tags: [AdAccounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - data
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of ad account IDs to update
 *               data:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   notifications:
 *                     type: boolean
 *                   hasCard:
 *                     type: boolean
 *                   hasPixel:
 *                     type: boolean
 *                   autoCommenting:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Bulk update completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updated:
 *                   type: integer
 *                   description: Number of updated records
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /ad-accounts/{id}:
 *   delete:
 *     summary: Delete an ad account
 *     tags: [AdAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ad account ID
 *     responses:
 *       200:
 *         description: Ad account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "AdAccount deleted"
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ad account not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /ad-accounts/{id}/active-ads:
 *   get:
 *     summary: Get all active ads inside specific ad account
 *     tags: [AdAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internal AdAccount database ID (NOT act_xxx)
 *     responses:
 *       200:
 *         description: List of active ads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 adAccountId:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 ads:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ad account not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /ad-accounts/{id}/ads-with-posts:
 *   get:
 *     summary: Get active ads with postId and postTitle for a specific ad account
 *     tags: [AdAccounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Internal AdAccount ID (database)
 *     responses:
 *       200:
 *         description: List of ads with extracted post data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 adAccountId:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 ads:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       postId:
 *                         type: string
 *                         nullable: true
 *                       postTitle:
 *                         type: string
 *                         nullable: true
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ad account not found
 *       500:
 *         description: Server error
 */

router.post('/', authMiddleware, controller.createAdAccount);
router.patch('/:id', authMiddleware, controller.updateAdAccount);
router.patch('/:id/auto-commenting', authMiddleware, controller.toggleAutoCommenting);
router.patch('/bulk', authMiddleware, controller.bulkUpdate);
router.get('/', authMiddleware, controller.getAdAccounts);
router.delete('/:id', authMiddleware, controller.deleteAdAccount);
router.get('/:id/active-ads', authMiddleware, controller.getActiveAds);
router.get('/:id/ads-with-posts', authMiddleware, controller.getAdsWithPostInfo);


module.exports = router;
