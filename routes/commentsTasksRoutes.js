const router = require('express').Router();
const controller = require('../controllers/commentsTasksController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     CommentTask:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         facebookAccountId:
 *           type: integer
 *         postId:
 *           type: string
 *         knownCommentIds:
 *           type: array
 *           items:
 *             type: string
 *         lastCheckedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         isActive:
 *           type: boolean
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
 * tags:
 *   - name: CommentTasks
 *     description: Tasks for tracking comments on Facebook posts
 */

/**
 * @swagger
 * /comments-tasks:
 *   get:
 *     summary: Get all comment tasks for the authenticated user
 *     tags: [CommentTasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of comment tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommentTask'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /comments-tasks/{id}:
 *   get:
 *     summary: Get a single comment task by ID
 *     tags: [CommentTasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Comment task data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentTask'
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /comments-tasks:
 *   post:
 *     summary: Create a new comment tracking task
 *     tags: [CommentTasks]
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
 *               - postId
 *             properties:
 *               facebookAccountId:
 *                 type: integer
 *               postId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentTask'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Facebook account not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /comments-tasks/{id}:
 *   patch:
 *     summary: Update an existing comment tracking task
 *     tags: [CommentTasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentTask'
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /comments-tasks/{id}:
 *   delete:
 *     summary: Delete a comment tracking task
 *     tags: [CommentTasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "CommentTask deleted"
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */

router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getOne);
router.post('/', authMiddleware, controller.create);
router.patch('/:id', authMiddleware, controller.update);
router.delete('/:id', authMiddleware, controller.remove);

module.exports = router;
