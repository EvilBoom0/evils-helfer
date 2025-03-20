const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  credits: { type: Number, default: 1000 }, // Bargeld
  bank: { type: Number, default: 0 }, // Bankguthaben
  bankLimit: { type: Number, default: 1000 }, // Maximales Bankguthaben
});

module.exports = mongoose.model("User", userSchema);
