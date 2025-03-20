const mongoose = require("mongoose");
const User = require("../models/user");

// MongoDB verbinden (Lokal oder Remote)
mongoose.connect("mongodb://localhost:27017/discord_casino", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Guthaben abrufen oder initialisieren
async function getBalance(userId) {
  let user = await User.findOne({ userId });
  if (!user) {
    user = new User({ userId, credits: 1000, bank: 0, bankLimit: 1000 });
    await user.save();
  }
  return user.credits;
}

// Guthaben setzen
async function setBalance(userId, amount) {
  await User.findOneAndUpdate({ userId }, { credits: Math.max(0, amount) }, { upsert: true });
}

// Guthaben hinzufügen
async function addBalance(userId, amount) {
  const user = await User.findOneAndUpdate(
    { userId },
    { $inc: { credits: amount } },
    { upsert: true, new: true }
  );
  return user.credits;
}

// Guthaben abziehen
async function removeBalance(userId, amount) {
  return addBalance(userId, -amount);
}

module.exports = { getBalance, setBalance, addBalance, removeBalance };
