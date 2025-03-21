module.exports = {
  name: "verify",
  description: "Startet den Verifizierungsprozess",
  async execute(message) {
    try {
      const fs = require("fs");
      const path = require("path");
      const { generateCaptcha } = require("../utils/captchaApi");
      const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

      const configPath = path.join(__dirname, "../data/verificationConfig.json");
      if (!fs.existsSync(configPath)) return message.reply("❌ Verifizierungs-Setup fehlt.");

      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (message.channel.id !== config.channelId)
        return message.reply("⚠️ Nutze den richtigen Channel zur Verifizierung.");

      const { image, answer } = await generateCaptcha();

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
        .setDescription("Bitte gib den **Text aus dem Bild** ein. Klicke unten auf den Button.")
        .setColor("Blurple")
        .setImage("attachment://captcha.png")
        .setFooter({ text: "Verifikation", iconURL: "https://i.imgur.com/KNnXoTU.png" });

      await message.reply({ embeds: [embed], components: [row], files: [attachment] });
    } catch (err) {
      console.error("❌ Fehler bei !verify:", err);
      message.reply("❌ Ein Fehler ist aufgetreten. Bitte informiere den Admin.");
    }
  }
};
