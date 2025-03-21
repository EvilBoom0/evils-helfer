const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { generateCaptcha } = require("../utils/captchaApi");

module.exports = {
  name: "verify",
  description: "Starte den Verifizierungsprozess",
  async execute(message, args, client) {
    try {
      const userId = message.author.id;
      const configPath = path.join(__dirname, "../data/verificationConfig.json");
      if (!fs.existsSync(configPath)) return message.reply("❌ Verifizierung nicht eingerichtet. Bitte zuerst `!verificationsetup` verwenden.");
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

      const captcha = await generateCaptcha();
      const attachment = new AttachmentBuilder(captcha.image, { name: "captcha.png" });

      const embed = new EmbedBuilder()
        .setTitle("🔐 Verifizierung")
        .setDescription(`<@${userId}>, gib den Code ein, um dich zu verifizieren.`)
        .setImage("attachment://captcha.png")
        .setColor("Blurple")
        .setFooter({
          text: "Verifikation • Powered by Evil's Helfer",
          iconURL: client.user.displayAvatarURL(),
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`verify:correct:${captcha.text}:${userId}`)
          .setLabel("✅ Code eingeben")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`captcha:refresh:${userId}`)
          .setLabel("🔁 Neues Captcha")
          .setStyle(ButtonStyle.Secondary)
      );

      const sentMessage = await message.channel.send({
        content: `<@${userId}>`,
        embeds: [embed],
        files: [attachment],
        components: [row],
      });

      const verificationTimeout = setTimeout(() => {
        sentMessage.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 15 * 60 * 1000); // 15 Minuten

      // Optional speichern für spätere Löschung bei Erfolg
      if (!client.userMessages) client.userMessages = new Map();
      client.userMessages.set(userId, { botMsg: sentMessage, userMsg: message, timeout: verificationTimeout });

    } catch (error) {
      console.error("❌ Fehler in !verify:", error);
      return message.reply("❌ Ein Fehler ist aufgetreten. Bitte informiere den Admin.");
    }
  },
};
