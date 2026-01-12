const router = require('express').Router();
const userController = require('../controllers/usersController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');


/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management routes
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', authMiddleware, roleMiddleware('SUPERADMIN'), userController.getAllUsers);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [SUPERADMIN, USER]
 *     responses:
 *       200:
 *         description: User role updated
 */
router.patch('/:id/role', authMiddleware, roleMiddleware('SUPERADMIN'), userController.updateRole);

/**
 * @swagger
 * /users/{id}/settings:
 *   put:
 *     summary: Update user settings (firstName, lastName, telegramChatId)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               telegramChatId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User settings updated
 */
router.put('/:id/settings', authMiddleware, userController.updateSettings);

module.exports = router;