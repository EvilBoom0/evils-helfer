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
        return message.reply("❌ Der Verifizierungsprozess ist nicht eingerichtet.");
      }

      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

      if (message.channel.id !== config.channelId) {
        return message.reply("⚠️ Bitte benutze den richtigen Channel zur Verifizierung!");
      }

      const { image, answer } = await generateCaptcha();

      const attachment = new AttachmentBuilder(image, { name: "captcha.png" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`verify_correct_${answer}_${message.author.id}`)
          .setLabel("Antwort eingeben")
          .setStyle(ButtonStyle.Primary)
      );

      const embed = new EmbedBuilder()
        .setTitle("🔐 Captcha-Verifizierung")
        .setDescription(`Hey <@${message.author.id}>!\nBitte gib den **Text aus dem Bild** ein.\nKlicke unten auf den Button, um deine Antwort einzugeben.`)
        .setColor("Blurple")
        .setImage("attachment://captcha.png")
        .setFooter({ text: "Verifikation notwendig", iconURL: "https://i.imgur.com/KNnXoTU.png" })
        .setTimestamp();

      await message.reply({ embeds: [embed], components: [row], files: [attachment] });

    } catch (error) {
      console.error("❌ Fehler in !verify:", error);
      return message.reply("❌ Ein Fehler ist aufgetreten. Bitte informiere den Admin.");
    }
  }
};
