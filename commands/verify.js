const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { generateCaptcha } = require("../utils/captchaApi");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "verify",
  description: "Starte den Verifizierungsprozess",
  async execute(message, args, client) {
    const configPath = path.join(__dirname, "../data/verificationConfig.json");
    if (!fs.existsSync(configPath)) {
      return message.reply("❌ Der Verifizierungsprozess ist nicht eingerichtet.");
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (message.channel.id !== config.channelId) {
      return message.reply("⚠️ Bitte benutze den Verifizierungschannel.");
    }

    const { image, answer } = await generateCaptcha();
    const attachment = new AttachmentBuilder(image, { name: "captcha.png" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_correct_${answer}_${message.author.id}`)
        .setLabel("Antwort eingeben")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`captcha_refresh_${message.author.id}`)
        .setLabel("🔁 Neues Captcha")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setTitle("🔐 Captcha-Verifizierung")
      .setDescription(`Hey <@${message.author.id}>!\nBitte gib den Text aus dem Bild ein.`)
      .setColor("Blurple")
      .setImage("attachment://captcha.png")
      .setFooter({ text: "Verifikation • Powered by Evil's Helfer", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    await message.reply({ embeds: [embed], components: [row], files: [attachment] });
  }
};
