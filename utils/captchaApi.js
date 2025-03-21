const axios = require("axios");

async function generateCaptcha() {
  try {
    const response = await axios.get("https://captcha-api.com/api/captcha");
    return {
      image: response.data.image,
      answer: response.data.answer
    };
  } catch (error) {
    console.error("Captcha API Fehler:", error);
    throw new Error("Captcha konnte nicht geladen werden.");
  }
}

module.exports = { generateCaptcha };
