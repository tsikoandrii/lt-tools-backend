const axios = require('axios');
const jwt = require("jsonwebtoken");
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function escapeMarkdownV2(text = '') {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

async function sendTelegramMessage(rawText, userId) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (!TELEGRAM_BOT_TOKEN) return;

  try {
    // Отримуємо telegramChatId користувача
    let chatId = TELEGRAM_CHAT_ID;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { telegramChatId: true }
      });

      chatId = user?.telegramChatId;
    }

    if (!chatId) {
      console.warn('⚠️ No chat ID available');
      return;
    }

    const text = escapeMarkdownV2(rawText);

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('❌ Telegram send error:', err.response?.data || err.message);
  }
}

function generateTelegramLink(userId) {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  return `https://t.me/${process.env.BOT_NAME}?start=${token}`;
}

module.exports = { sendTelegramMessage, generateTelegramLink };