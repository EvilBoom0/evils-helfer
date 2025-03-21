const svgCaptcha = require("svg-captcha");
const sharp = require("sharp");

async function generateCaptcha() {
  const captcha = svgCaptcha.create({
    noise: 3,
    color: true,
    size: 6,
    background: '#ffffff',
    ignoreChars: '0o1ilI' // besser lesbar
  });

  const pngBuffer = await sharp(Buffer.from(captcha.data)).png().toBuffer();

  return {
    image: pngBuffer,
    answer: captcha.text
  };
}

module.exports = { generateCaptcha };
