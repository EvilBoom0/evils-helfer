const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function generateRandomText(length = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function drawCaptcha(text) {
  const width = 250;
  const height = 100;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Hintergrund
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0, 0, width, height);

  // Linien als Störung
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)},${Math.floor(
      Math.random() * 255
    )},${Math.floor(Math.random() * 255)},0.8)`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }

  // Text
  for (let i = 0; i < text.length; i++) {
    const angle = (Math.random() - 0.5) * 0.7;
    ctx.save();
    ctx.translate(40 + i * 35, 60);
    ctx.rotate(angle);
    ctx.font = `${Math.floor(Math.random() * 10) + 36}px Sans`;
    ctx.fillStyle = "#333";
    ctx.fillText(text[i], -10, 10);
    ctx.restore();
  }

  return canvas;
}

function generateCaptcha() {
  const text = generateRandomText();
  const canvas = drawCaptcha(text);

  const buffer = canvas.toBuffer("image/png");
  const fileName = `captcha_${crypto.randomBytes(6).toString("hex")}.png`;
  const filePath = path.join(__dirname, "../temp", fileName);

  // temp-Ordner erstellen, falls er nicht existiert
  if (!fs.existsSync(path.join(__dirname, "../temp"))) {
    fs.mkdirSync(path.join(__dirname, "../temp"));
  }

  fs.writeFileSync(filePath, buffer);
  return {
    image: filePath,
    answer: text
  };
}

module.exports = { generateCaptcha };
