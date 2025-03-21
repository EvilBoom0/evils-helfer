const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

registerFont(path.join(__dirname, "../assets/fonts/arial.ttf"), { family: "Arial" });

function generateRandomText(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function generateNoise(ctx, width, height) {
  for (let i = 0; i < 50; i++) {
    ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)},${Math.floor(
      Math.random() * 255
    )},${Math.floor(Math.random() * 255)},0.8)`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }
}

async function generateCaptcha() {
  const width = 220;
  const height = 80;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Hintergrund
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, width, height);

  // Noise
  generateNoise(ctx, width, height);

  // Text
  const text = generateRandomText();
  ctx.font = "36px Arial";
  ctx.fillStyle = "#000";
  for (let i = 0; i < text.length; i++) {
    const letter = text[i];
    ctx.save();
    ctx.translate(30 + i * 30, 50 + Math.random() * 10 - 5);
    ctx.rotate((Math.random() - 0.5) * 0.5);
    ctx.fillText(letter, 0, 0);
    ctx.restore();
  }

  // Captcha exportieren
  const buffer = canvas.toBuffer("image/png");
  const filename = `captcha-${crypto.randomUUID()}.png`;

  return {
    imageBuffer: buffer,
    text,
    filename
  };
}

module.exports = generateCaptcha;
