const { createCanvas, registerFont } = require("canvas");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const https = require("https");

const fontUrl = "https://fonts.gstatic.com/s/rubikdoodleshadow/v1/bWti7ejTQT7Z2a2V-Gg4ewRPlkZ5iNGODKk.woff2";
const fontPath = path.join("/tmp", "captchaFont.woff2");

function downloadFontIfNotExists() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(fontPath)) return resolve(fontPath);

    const file = fs.createWriteStream(fontPath);
    https.get(fontUrl, (res) => {
      if (res.statusCode !== 200) return reject(new Error("Font download failed."));
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(fontPath)));
    }).on("error", (err) => reject(err));
  });
}

function getRandomText(length = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function drawCaptcha(text) {
  const width = 300, height = 100;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Hintergrund
  ctx.fillStyle = "#1e1e2f";
  ctx.fillRect(0, 0, width, height);

  // Rauschen
  for (let i = 0; i < 30; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${Math.random()})`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }

  // Verzerrte Buchstaben
  ctx.font = "40px CustomCaptchaFont";
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < text.length; i++) {
    const angle = (Math.random() - 0.5) * 0.7;
    ctx.save();
    ctx.translate(50 + i * 45, 60 + Math.random() * 10);
    ctx.rotate(angle);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }

  return canvas.toBuffer("image/png");
}

async function generateCaptcha() {
  await downloadFontIfNotExists();
  registerFont(fontPath, { family: "CustomCaptchaFont" });

  const answer = getRandomText();
  const image = drawCaptcha(answer);

  const filename = `captcha_${uuidv4()}.png`;
  const imagePath = path.join(__dirname, "../temp", filename);
  fs.writeFileSync(imagePath, image);

  return { image: imagePath, answer };
}

module.exports = { generateCaptcha };
