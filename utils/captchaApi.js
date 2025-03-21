const axios = require("axios");

async function generateCaptcha() {
  const response = await axios.get("https://captcha-api.com/api/captcha");
  return {
    image: response.data.image, // base64 PNG
    answer: response.data.answer
  };
}

module.exports = { generateCaptcha };
