const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { commentTasksQueue } = require('./commentTasks.queue');

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/bull-board');

createBullBoard({
  queues: [
    new BullMQAdapter(commentTasksQueue),
  ],
  serverAdapter,
});

module.exports = serverAdapter.getRouter();
