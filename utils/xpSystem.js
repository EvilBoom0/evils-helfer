'use strict';
const mongoose = require('mongoose');
const { Schema, model, connect } = mongoose;
async function connectDB() {
  try {
    await connect("mongodb://localhost:27017/discord_casino", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("XP System: Connected to MongoDB");
  } catch (error) {
    console.error("XP System: MongoDB connection error", error);
  }
}
connectDB();
const xpSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 }
}, { timestamps: true });
const XPModel = model("XP", xpSchema);
async function getXP(userId) {
  try {
    let userXP = await XPModel.findOne({ userId });
    if (!userXP) {
      userXP = new XPModel({ userId });
      await userXP.save();
    }
    return { xp: userXP.xp, level: userXP.level };
  } catch (error) {
    console.error("XP System getXP Error:", error);
    return { xp: 0, level: 1 };
  }
}
async function addXP(userId, xpToAdd) {
  try {
    let userXP = await XPModel.findOneAndUpdate(
      { userId },
      { $inc: { xp: xpToAdd } },
      { new: true, upsert: true }
    );
    return { xp: userXP.xp, level: userXP.level };
  } catch (error) {
    console.error("XP System addXP Error:", error);
    return { xp: 0, level: 1 };
  }
}
async function setXP(userId, xp, level) {
  try {
    let userXP = await XPModel.findOneAndUpdate(
      { userId },
      { xp: xp, level: level },
      { new: true, upsert: true }
    );
    return { xp: userXP.xp, level: userXP.level };
  } catch (error) {
    console.error("XP System setXP Error:", error);
    return { xp: 0, level: 1 };
  }
}
async function resetXP(userId) {
  try {
    let userXP = await XPModel.findOneAndUpdate(
      { userId },
      { xp: 0, level: 1 },
      { new: true, upsert: true }
    );
    return { xp: userXP.xp, level: userXP.level };
  } catch (error) {
    console.error("XP System resetXP Error:", error);
    return { xp: 0, level: 1 };
  }
}
module.exports = { getXP, addXP, setXP, resetXP };
