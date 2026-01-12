const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { commentTasksQueue } = require('./commentTasks.queue');

const EVERY_2_MIN = 2 * 60 * 1000;

function jobKey(taskId) {
  return `commentTask:${taskId}`;
}

async function clearRepeatables() {
  const repeatables = await commentTasksQueue.getRepeatableJobs();
  for (const r of repeatables) {
    await commentTasksQueue.removeRepeatableByKey(r.key);
  }
}

async function clearJobs() {
  await commentTasksQueue.clean(0, 'completed');
  await commentTasksQueue.clean(0, 'failed');
  await commentTasksQueue.clean(0, 'delayed');
  await commentTasksQueue.clean(0, 'wait');
}

async function scheduleTask(taskId, everyMs = EVERY_2_MIN) {
  await commentTasksQueue.add(
    jobKey(taskId),
    { taskId },
    {
      repeat: { every: everyMs },
      removeOnComplete: true,
      removeOnFail: true,
    }
  );

}

async function unscheduleTask(taskId) {
  const name = `commentTask:${taskId}`;
  const repeatables = await commentTasksQueue.getRepeatableJobs();

  for (const r of repeatables) {
    if (r.name === name) {
      await commentTasksQueue.removeRepeatableByKey(r.key);
      console.log(`🗑 Removed repeatable job for task ${taskId}`);
    }
  }
}


async function bootstrapSchedule() {
  await clearRepeatables();
  await clearJobs();

  const tasks = await prisma.commentTask.findMany({ where: { isActive: true } });

  for (const t of tasks) {
    await scheduleTask(t.id);
  }
}

module.exports = { scheduleTask, unscheduleTask, bootstrapSchedule };
