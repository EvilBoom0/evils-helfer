const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateCaptchaText(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function randomColor() {
  const r = () => Math.floor(Math.random() * 150);
  return `rgb(${r()},${r()},${r()})`;
}

async function generateCaptcha(userId) {
  const width = 200;
  const height = 80;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Hintergrund
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const text = generateCaptchaText();
  ctx.font = "36px sans-serif";

  // Buchstaben
  for (let i = 0; i < text.length; i++) {
    ctx.fillStyle = randomColor();
    const angle = (Math.random() - 0.5) * 0.5;
    ctx.save();
    ctx.translate(25 + i * 30, 50);
    ctx.rotate(angle);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }

  // Rauschen & Linien
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = randomColor();
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = randomColor();
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }

  // Datei speichern
  const dir = path.join(__dirname, "..", "data", "captcha");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${userId}.png`);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(filePath, buffer);
  return { filePath, text };
}

module.exports = { generateCaptcha };
