const { createCanvas } = require("canvas");

function generateRandomText(length = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function generateCaptcha() {
  const width = 250;
  const height = 100;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 150; i++) {
    ctx.fillStyle = `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.3)`;
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const text = generateRandomText();
  ctx.font = "40px sans-serif";
  ctx.fillStyle = "#000000";
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.translate(40 + i * 35, 55 + Math.random() * 20 - 10);
    ctx.rotate((Math.random() - 0.5) * 0.5);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }

  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.8)`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.bezierCurveTo(
      Math.random() * width, Math.random() * height,
      Math.random() * width, Math.random() * height,
      Math.random() * width, Math.random() * height
    );
    ctx.stroke();
  }

  return {
    image: canvas.toBuffer("image/png"),
    answer: text
  };
}

module.exports = {
  generateCaptcha
};
