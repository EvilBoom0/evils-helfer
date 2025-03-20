const mongoose = require("mongoose");
const User = require("../models/user");

async function addXP(userId, xpGain) {
  let user = await User.findOne({ userId });
  if (!user) {
    user = new User({
      userId,
      xp: 0,
      level: 1,
      credits: 1000,
      bank: 0,
      bankLimit: 1000
    });
  }
  user.xp += xpGain;
  let levelsGained = 0;
  while (user.xp >= user.level * 100) {
    user.xp -= user.level * 100;
    user.level += 1;
    levelsGained++;
  }
  await user.save();
  return { xp: user.xp, level: user.level, levelsGained };
}

async function getXP(userId) {
  let user = await User.findOne({ userId });
  if (!user) {
    user = new User({
      userId,
      xp: 0,
      level: 1,
      credits: 1000,
      bank: 0,
      bankLimit: 1000
    });
    await user.save();
  }
  return { xp: user.xp, level: user.level };
}

async function setXP(userId, xp) {
  let user = await User.findOneAndUpdate(
    { userId },
    { xp: xp },
    { new: true, upsert: true }
  );
  return { xp: user.xp, level: user.level };
}

module.exports = { addXP, getXP, setXP };
