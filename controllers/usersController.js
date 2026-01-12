const userService = require('../services/userService');
const telegramService = require("../services/telegramService")

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const updated = await userService.updateRole(req.params.id, req.body.role);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.getTelegramLink = async (req, res) => {
  const userId = req.user.id;

  const link = telegramService.generateTelegramLink(userId);

  res.json({ telegramLink: link });
};

exports.updateSettings = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const updated = await userService.updateUserSettings(userId, {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      telegramChatId: req.body.telegramChatId,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};
