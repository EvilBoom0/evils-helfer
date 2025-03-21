const { createCanvas, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const https = require("https");
const os = require("os");

const fontUrl = "https://fonts.gstatic.com/s/rajdhani/v16/LDI1apSQOAYtSuYWp8ZhfYe8.ttf"; // Google Fonts URL
const fontPath = path.join(os.tmpdir(), "customFont.ttf");

function downloadFontIfNotExists(callback) {
  if (fs.existsSync(fontPath)) return callback();

  const file = fs.createWriteStream(fontPath);
  https.get(fontUrl, (response) => {
    response.pipe(file);
    file.on("finish", () => {
      file.close(callback);
    });
  });
}

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
    ctx.strokeStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.5)`;
    ctx.beginPath();
    ctx.moveTo(Math.random()*width, Math.random()*height);
    ctx.lineTo(Math.random()*width, Math.random()*height);
    ctx.stroke();
  }
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.3)`;
    ctx.beginPath();
    ctx.arc(Math.random()*width, Math.random()*height, Math.random()*2, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function distortText(ctx, text, width, height) {
  ctx.save();
  ctx.translate(15, height / 2);
  for (let i = 0; i < text.length; i++) {
    const angle = (Math.random() - 0.5) * 1.2;
    const fontSize = 36 + Math.floor(Math.random() * 8);
    ctx.rotate(angle);
    ctx.font = `${fontSize}px 'CustomFont'`;
    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 60)}, ${Math.floor(
      Math.random() * 60
    )}, ${Math.floor(Math.random() * 60)})`;
    ctx.fillText(text[i], i * 35, Math.random() * 10);
    ctx.rotate(-angle);
  }
  ctx.restore();
}

function generateCaptcha() {
  return new Promise((resolve, reject) => {
    downloadFontIfNotExists(() => {
      try {
        registerFont(fontPath, { family: "CustomFont" });
        const width = 280;
        const height = 110;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, width, height);

        const text = generateRandomText();
        distortText(ctx, text, width, height);
        generateNoise(ctx, width, height);

        const buffer = canvas.toBuffer("image/png");
        const filename = `${uuidv4()}.png`;
        const filePath = path.join(__dirname, "../temp", filename);
        fs.writeFileSync(filePath, buffer);

        resolve({ image: filePath, answer: text });
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = {
  generateCaptcha,
};
