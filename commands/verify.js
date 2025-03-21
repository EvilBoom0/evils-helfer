const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { generateCaptcha } = require("../utils/captchaApi");

module.exports = {
  name: "verify",
  description: "Startet den Verifizierungsprozess mit einem Captcha.",

  async execute(message) {
    const userId = message.author.id;
    const channel = message.channel;

    const { image, answer, filePath } = await generateCaptcha();

    const attachment = new AttachmentBuilder(image, { name: "captcha.png" });

    const embed = new EmbedBuilder()
      .setTitle("🔐 Verifizierung")
      .setDescription(`<@${userId}>, bitte löse das folgende Captcha:`)
      .setColor("Blurple")
      .setImage("attachment://captcha.png")
      .setFooter({
        text: "Verifikation • Powered by Evil's Helfer",
        iconURL: message.client.user.displayAvatarURL(),
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify:correct:${answer}:${userId}`)
        .setLabel("Antwort eingeben")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`captcha:refresh:${userId}`)
        .setLabel("🔁 Neues Captcha")
        .setStyle(ButtonStyle.Secondary)
    );

    const sent = await channel.send({
      embeds: [embed],
      components: [row],
      files: [attachment],
    });

    setTimeout(() => {
      fs.unlink(filePath, () => {});
    }, 2 * 60 * 1000); // Lösche Bild nach 2 Minuten

    setTimeout(() => {
      sent.delete().catch(() => {});
      message.delete().catch(() => {});
    }, 15 * 60 * 1000); // 15 Minuten Timeout
  },
};
