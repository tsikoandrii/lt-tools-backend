const { Worker } = require('bullmq');
const { connection } = require('./commentTasks.queue');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { processCommentTask } = require('../services/commentTasksService');

new Worker(
  'commentTasks',
  async (job) => {
    const { taskId } = job.data;
    const task = await prisma.commentTask.findUnique({
      where: { id: taskId },
      include: { facebookAccount: { include: { Proxy: true } } },
    });
    if (!task || !task.isActive) return;
    return processCommentTask(task);
  },
  {
    connection,
    concurrency: 5,
    settings: { backoffStrategies: {} },
  }
)
  .on('completed', (job, res) => console.log(`✅ Task ${job.data.taskId}`, res))
  .on('failed', (job, err) => console.error(`❌ Task ${job?.data?.taskId}:`, err.message));
