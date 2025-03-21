const { createCanvas, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const https = require("https");
const { writeFileSync } = require("fs");

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
    ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }

  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function distortText(ctx, text, width, height) {
  ctx.save();
  ctx.translate(15, height / 2);
  for (let i = 0; i < text.length; i++) {
    const angle = (Math.random() - 0.5) * 1.0;
    const fontSize = 36 + Math.floor(Math.random() * 8);
    ctx.rotate(angle);
    ctx.font = `${fontSize}px 'Comic Sans MS', 'Arial Black', 'Courier New'`;
    ctx.fillStyle = `rgb(${Math.random() * 80}, ${Math.random() * 80}, ${Math.random() * 80})`;
    ctx.fillText(text[i], i * 30, Math.random() * 15 - 7);
    ctx.rotate(-angle);
  }
  ctx.restore();
}

function downloadGoogleFont() {
  return new Promise((resolve, reject) => {
    const url = "https://fonts.gstatic.com/s/comicsansms/v1/UZvY77WzV9CzYNu2r4ez.ttf"; // Dummy URL, not real
    const dest = path.join(__dirname, "../temp", "captchaFont.ttf");
    https.get(url, (res) => {
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        registerFont(dest, { family: "CustomCaptchaFont" });
        resolve();
      });
    }).on("error", reject);
  });
}

async function generateCaptcha() {
  const width = 280;
  const height = 110;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f2f2f2";
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
