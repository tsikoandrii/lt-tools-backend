const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const commentTasksQueue = new Queue('commentTasks', { connection });

module.exports = { commentTasksQueue, connection };
