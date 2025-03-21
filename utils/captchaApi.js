const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function generateRandomText(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getRandomColor() {
  const r = Math.floor(Math.random() * 150);
  const g = Math.floor(Math.random() * 150);
  const b = Math.floor(Math.random() * 150);
  return `rgb(${r}, ${g}, ${b})`;
}

function generateCaptcha() {
  const width = 300;
  const height = 120;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  const text = generateRandomText();

  // Hintergrundrauschen
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = getRandomColor();
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Störlinien
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = getRandomColor();
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }

  // Verzerrter Text
  ctx.font = 'bold 48px Sans';
  for (let i = 0; i < text.length; i++) {
    const letter = text[i];
    const x = 30 + i * 40 + Math.random() * 10 - 5;
    const y = 70 + Math.random() * 10 - 5;
    ctx.fillStyle = getRandomColor();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.5);
    ctx.fillText(letter, 0, 0);
    ctx.restore();
  }

  const filename = `captcha_${uuidv4()}.png`;
  const filePath = path.join(__dirname, '..', 'temp', filename);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);

  return { text, filePath };
}

module.exports = { generateCaptcha };
