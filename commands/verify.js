const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { generateCaptcha } = require("../utils/captchaApi");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../data/verificationConfig.json");

module.exports = {
  name: "verify",
  description: "Startet den Verifizierungsprozess",
  async execute(message) {
    if (!fs.existsSync(configPath)) return;
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (message.channel.id !== config.channelId) return message.reply("⚠️ Bitte benutze den richtigen Channel zur Verifizierung!");

    const { image, answer } = await generateCaptcha();

    const imageBuffer = Buffer.from(image, "base64");
    const attachment = new AttachmentBuilder(imageBuffer, { name: "captcha.png" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`verify_correct_${answer}_${message.author.id}`).setLabel("Antwort eingeben").setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setTitle("🔐 Captcha-Verifizierung")
      .setDescription("Bitte gib den **Text aus dem Bild** ein. Klicke unten auf den Button, um deine Lösung einzugeben.")
      .setColor("Blurple")
      .setImage("attachment://captcha.png")
      .setFooter({ text: "Verifikation erforderlich", iconURL: "https://i.imgur.com/KNnXoTU.png" });

    await message.reply({ embeds: [embed], components: [row], files: [attachment] });
  }
};
