const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateCaptchaText() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateCaptcha() {
  const captchaText = generateCaptchaText();
  const canvas = createCanvas(250, 100);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "40px Sans";
  ctx.fillStyle = "#000000";
  ctx.fillText(captchaText, 50, 65);

  const buffer = canvas.toBuffer("image/png");
  const filePath = path.join(__dirname, `../temp/captcha-${Date.now()}.png`);
  fs.writeFileSync(filePath, buffer);

  return {
    image: filePath,
    answer: captchaText,
  };
}

module.exports = { generateCaptcha };
