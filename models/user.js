const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  credits: { type: Number, default: 1000 },
  bank: { type: Number, default: 0 },
  bankLimit: { type: Number, default: 1000 },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
