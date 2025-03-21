const { createCanvas, registerFont } = require("canvas");
const fs = require("fs");
const path = require("path");

// Optional: Benutzerdefinierte Schriftart registrieren
// registerFont(path.join(__dirname, 'fonts/DejaVuSans.ttf'), { family: 'DejaVuSans' });

function generateRandomText(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function applyDistortion(ctx, width, height) {
  for (let i = 0; i < 20; i++) {
    ctx.strokeStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.7)`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }
}

function generateCaptcha() {
  return new Promise((resolve, reject) => {
    const width = 300;
    const height = 100;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Hintergrundfarbe
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, width, height);

    // Verzerrungen hinzufügen
    applyDistortion(ctx, width, height);

    // Captcha-Text generieren
    const captchaText = generateRandomText();

    // Textstil
    ctx.font = "bold 40px sans-serif";
    ctx.fillStyle = "#000";
    const offsetX = 30;
    for (let i = 0; i < captchaText.length; i++) {
      const angle = (Math.random() - 0.5) * 0.5;
      ctx.save();
      ctx.translate(offsetX + i * 40, 60);
      ctx.rotate(angle);
      ctx.fillText(captchaText[i], 0, 0);
      ctx.restore();
    }

    // Pfad generieren
    const filename = `${Date.now()}-${Math.floor(Math.random() * 10000)}.png`;
    const outPath = path.join(__dirname, "../temp", filename);

    const out = fs.createWriteStream(outPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on("finish", () => {
      resolve({ text: captchaText, filePath: outPath });
    });
    out.on("error", reject);
  });
}

module.exports = { generateCaptcha };
