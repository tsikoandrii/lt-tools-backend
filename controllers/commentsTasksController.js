const { PrismaClient } = require('@prisma/client');
const { getPageTokenByPostId } = require("../services/facebookService");
const prisma = new PrismaClient();
const { commentTasksQueue } = require('../queues/commentTasks.queue');
const {unscheduleTask, scheduleTask} = require("../queues/commentTasks.scheduler");

/**
 * GET /comments-tasks
 */
exports.getAll = async (req, res, next) => {
  try {
    const tasks = await prisma.commentTask.findMany({
      where: req.user.role === 'SUPERADMIN'
        ? {}
        : {
          userId: req.user.id
        },
      include: { facebookAccount: true }
    });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /comments-tasks/:id
 */
exports.getOne = async (req, res, next) => {
  const taskId = parseInt(req.params.id);

  try {
    const task = await prisma.commentTask.findUnique({
      where: { id: taskId },
      include: { facebookAccount: true }
    });

    if (!task) {
      return res.status(404).json({ message: 'CommentTask not found' });
    }

    const isOwner = task.userId === req.user.id;
    if (req.user.role !== 'SUPERADMIN' && !isOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /comments-tasks
 */
exports.create = async (req, res, next) => {
  try {
    const facebookAccountId = parseInt(req.body.facebookAccountId);
    const { postId, action = 'TRACK', notification = false, postTitle = "", adAccountId } = req.body;

    if (!facebookAccountId || !postId || !adAccountId) {
      return res.status(400).json({ message: 'facebookAccountId, adAccountId and postId are required' });
    }

    const facebookAccount = await prisma.facebookAccount.findUnique({
      where: { id: facebookAccountId },
      include: { Proxy: true }
    });

    if (!facebookAccount) {
      return res.status(404).json({ message: 'Facebook account not found' });
    }

    const isOwner = facebookAccount.userId === req.user.id;
    if (req.user.role !== 'SUPERADMIN' && !isOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const existing = await prisma.commentTask.findUnique({
      where: { postId },
    });

    if (existing) {
      return res.status(409).json({ message: 'Task with this postId already exists' });
    }

    const { pageAccessToken } = await getPageTokenByPostId(
      facebookAccount.accessToken,
      facebookAccount.Proxy,
      postId
    );

    if (!pageAccessToken) {
      return res.status(400).json({ message: 'Unable to resolve Page Access Token' });
    }

    const task = await prisma.commentTask.create({
      data: {
        userId: facebookAccount.userId,
        facebookAccountId,
        adAccountId,
        postId,
        postTitle,
        knownCommentIds: [],
        isActive: true,
        action,
        notification,
        pageAccessToken
      },
      include: { facebookAccount: true },
    });

    await scheduleTask(task.id);

    return res.status(201).json({
      message: 'Comment tracking task created',
      task,
    });

  } catch (err) {
    next(err);
  }
};


/**
 * PATCH /comments-tasks/:id
 */
exports.update = async (req, res, next) => {
  const taskId = parseInt(req.params.id);
  const {
    isActive,
    action,
    notification,
    adAccountId,
    postId,
    postTitle,
  } = req.body;

  try {
    const task = await prisma.commentTask.findUnique({
      where: { id: taskId },
      include: { facebookAccount: true },
    });

    if (!task) {
      return res.status(404).json({ message: 'CommentTask not found' });
    }

    const isOwner = task.userId === req.user.id;
    if (req.user.role !== 'SUPERADMIN' && !isOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (postId && postId !== task.postId) {
      const exists = await prisma.commentTask.findUnique({
        where: { postId },
      });

      if (exists) {
        return res.status(409).json({ message: 'Task with this postId already exists' });
      }
    }

    await unscheduleTask(taskId);

    const updated = await prisma.commentTask.update({
      where: { id: taskId },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(action && { action }),
        ...(notification !== undefined && { notification }),
        ...(adAccountId && { adAccountId }),
        ...(postId && { postId }),
        ...(postTitle !== undefined && { postTitle }),
      },
      include: { facebookAccount: true },
    });

    await scheduleTask(taskId);

    res.json({
      message: 'CommentTask updated successfully',
      task: updated,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * DELETE /comments-tasks/:id
 */
exports.remove = async (req, res, next) => {
  const taskId = parseInt(req.params.id);

  try {
    const task = await prisma.commentTask.findUnique({
      where: { id: taskId },
      include: { facebookAccount: true }
    });

    if (!task) return res.status(404).json({ message: 'CommentTask not found' });

    const isOwner = task.userId === req.user.id;
    if (req.user.role !== 'SUPERADMIN' && !isOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // 1️⃣ Спочатку: видалити REPEATABLE job
    const repeatables = await commentTasksQueue.getRepeatableJobs();
    const key = `commentTask:${taskId}`;

    const r = repeatables.find(r => r.id === key);
    if (r) {
      await commentTasksQueue.removeRepeatableByKey(r.key);
    }

    await unscheduleTask(taskId);

    // 3️⃣ Видаляємо з БД
    await prisma.commentTask.delete({
      where: { id: taskId }
    });

    res.json({ message: 'CommentTask deleted' });
  } catch (err) {
    next(err);
  }
};

