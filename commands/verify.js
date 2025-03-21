const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { generateCaptcha } = require("../utils/captchaApi");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "verify",
  description: "Startet den Verifizierungsprozess",
  async execute(message) {
    try {
      const configPath = path.join(__dirname, "../data/verificationConfig.json");

      if (!fs.existsSync(configPath)) {
        console.log("❌ config file not found");
        return message.reply("❌ Der Verifizierungsprozess ist nicht eingerichtet.");
      }

      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

      if (message.channel.id !== config.channelId) {
        console.log("❌ falscher channel");
        return message.reply("⚠️ Bitte benutze den richtigen Channel zur Verifizierung!");
      }

      const { image, answer } = await generateCaptcha();

      if (!image || !answer) {
        console.log("❌ Captcha-API Fehler: Kein Bild oder keine Antwort erhalten");
        return message.reply("❌ Captcha konnte nicht geladen werden. Bitte versuche es später erneut.");
      }

      const imageBuffer = Buffer.from(image, "base64");
      const attachment = new AttachmentBuilder(imageBuffer, { name: "captcha.png" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`verify_correct_${answer}_${message.author.id}`)
          .setLabel("Antwort eingeben")
          .setStyle(ButtonStyle.Primary)
      );

      const embed = new EmbedBuilder()
        .setTitle("🔐 Captcha-Verifizierung")
        .setDescription("Bitte gib den **Text aus dem Bild** ein. Klicke unten auf den Button, um deine Lösung einzugeben.")
        .setColor("Blurple")
        .setImage("attachment://captcha.png")
        .setFooter({ text: "Verifikation erforderlich", iconURL: "https://i.imgur.com/KNnXoTU.png" });

      await message.reply({ embeds: [embed], components: [row], files: [attachment] });

    } catch (error) {
      console.error("❌ Fehler in !verify:", error);
      return message.reply("❌ Ein Fehler ist aufgetreten. Bitte informiere den Admin.");
    }
  }
};
