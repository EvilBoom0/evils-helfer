const { createCanvas, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// 🧠 Font laden
registerFont(path.join(__dirname, "../fonts/Ransom.ttf"), { family: "Ransom" });

function generateRandomText(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function generateNoise(ctx, width, height) {
  for (let i = 0; i < 120; i++) {
    ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }
  for (let i = 0; i < 150; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDistortedText(ctx, text, width, height) {
  const charSpacing = width / (text.length + 1);

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const angle = (Math.random() - 0.5) * 0.8;
    const fontSize = 34 + Math.floor(Math.random() * 8);
    const x = charSpacing * (i + 1);
    const y = height / 2 + (Math.random() * 10 - 5);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = `${fontSize}px Ransom`;
    ctx.fillStyle = `rgb(${Math.random() * 80}, ${Math.random() * 80}, ${Math.random() * 80})`;
    ctx.fillText(char, -fontSize / 2.5, fontSize / 3);
    ctx.restore();
  }
}

function generateCaptcha() {
  const width = 280;
  const height = 110;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, width, height);

  const text = generateRandomText(6);
  drawDistortedText(ctx, text, width, height);
  generateNoise(ctx, width, height);

  const buffer = canvas.toBuffer("image/png");
  const filename = `${uuidv4()}.png`;
  const filePath = path.join(__dirname, "../temp", filename);
  fs.writeFileSync(filePath, buffer);

  return {
    image: filePath,
    answer: text,
  };
}

module.exports = {
  generateCaptcha,
};
