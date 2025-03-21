const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

function generateRandomText(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function generateNoise(ctx, width, height) {
  for (let i = 0; i < 100; i++) {
    ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
      Math.random() * 255
    )}, ${Math.floor(Math.random() * 255)}, 0.6)`;
    ctx.beginPath();
    ctx.moveTo(
      Math.random() * width,
      Math.random() * height
    );
    ctx.lineTo(
      Math.random() * width,
      Math.random() * height
    );
    ctx.stroke();
  }

  for (let i = 0; i < 150; i++) {
    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
      Math.random() * 255
    )}, ${Math.floor(Math.random() * 255)}, 0.4)`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * width,
      Math.random() * height,
      Math.random() * 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function distortText(ctx, text, width, height) {
  ctx.save();
  ctx.translate(10, height / 1.8);
  for (let i = 0; i < text.length; i++) {
    const angle = (Math.random() - 0.5) * 0.8;
    const fontSize = 32 + Math.floor(Math.random() * 10);
    ctx.rotate(angle);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(
      Math.random() * 100
    )}, ${Math.floor(Math.random() * 100)})`;
    ctx.fillText(text[i], i * 30, Math.random() * 10);
    ctx.rotate(-angle);
  }
  ctx.restore();
}

function generateCaptcha() {
  const width = 250;
  const height = 100;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, width, height);

  const text = generateRandomText();
  distortText(ctx, text, width, height);
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
