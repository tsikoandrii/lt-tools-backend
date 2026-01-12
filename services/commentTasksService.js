const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { getComments, deleteComment, hideComment } = require('./facebookService');
const { sendTelegramMessage } = require('./telegramService');

async function processCommentTask(task) {
  const { id, postId, action, notification, knownCommentIds = [], facebookAccount, pageAccessToken } = task;
  const { accessToken, Proxy } = facebookAccount || {};

  if (!accessToken || !postId) {
    return { status: 'failed', reason: 'Missing accessToken or postId' };
  }

  try {
    const response = await getComments(accessToken, Proxy, postId);
    const allComments = response?.data || [];

    const newComments = allComments.filter(c => !knownCommentIds.includes(c.id));

    if (newComments.length === 0) {
      await prisma.commentTask.update({
        where: { id },
        data: { lastCheckedAt: new Date() },
      });
      return { status: 'no_new_comments' };
    }

    if (action === 'DELETE' || action === 'HIDE') {
      await Promise.all(
        newComments.map(async c => {
          try {
            if (action === 'DELETE') {
              await deleteComment(accessToken, Proxy, c.id, pageAccessToken);
            } else {
              await hideComment(accessToken, Proxy, c.id, pageAccessToken);
            }
          } catch (err) {
            console.error(`⚠️ Failed to ${action} comment ${c.id}:`, err.message);
          }
        })
      );
    }

    if (notification) {
      const message = [
        `💬 New comments under post:`,
        ...newComments.map(c => `👤 *${c.from?.name || 'Unknown'}*: ${c.message || ''}`)
      ].join('\n');

      try {
        await sendTelegramMessage(message);
      } catch {
        console.error(`⚠️ Failed to send notification for ${c.id}:`, err.message);
      }
    }

    await prisma.commentTask.update({
      where: { id },
      data: {
        knownCommentIds: [...new Set([...knownCommentIds, ...newComments.map(c => c.id)])],
        lastCheckedAt: new Date(),
      },
    });

    return {
      status: 'completed',
      newCommentsCount: newComments.length,
      postId,
      actionPerformed: action,
    };
  } catch (err) {
    await prisma.commentTask.update({
      where: { id },
      data: { lastCheckedAt: new Date() },
    });

    return { status: 'error', message: err.message };
  }
}

module.exports = { processCommentTask };
