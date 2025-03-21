const { AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs");
const generateCaptcha = require("../utils/captchaApi");
const Verification = require("../models/verification");

module.exports = {
  name: "verify",
  description: "Starte den Verifizierungsprozess.",
  async execute(message, args, client) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    const existing = await Verification.findOne({ guildId, userId });
    if (existing && existing.verified) return message.reply({ content: "✅ Du bist bereits verifiziert!", ephemeral: true });

    const data = await Verification.findOneAndUpdate(
      { guildId, userId },
      { $setOnInsert: { verified: false } },
      { upsert: true, new: true }
    );

    if (data.challenge && !data.verified) {
      return message.reply({ content: "⚠️ Du hast bereits ein offenes Captcha. Bitte löse es zuerst.", ephemeral: true });
    }

    const { imageBuffer, text, filename } = await generateCaptcha();

    data.challenge = text;
    await data.save();

    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle("🔐 Verifizierung erforderlich")
      .setDescription(`Hey <@${userId}>, gib den Text aus dem Captcha unten ein, um Zugriff zum Server zu erhalten.`)
      .setFooter({ text: "Powered by Evil's Helfer", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    const attachment = new AttachmentBuilder(imageBuffer, { name: filename });

    const newCaptchaButton = new ButtonBuilder()
      .setCustomId(`captcha_new_${userId}`)
      .setLabel("Neues Captcha")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(newCaptchaButton);

    const sent = await message.channel.send({
      content: `<@${userId}>`,
      embeds: [embed],
      files: [attachment],
      components: [row]
    });

    setTimeout(async () => {
      const check = await Verification.findOne({ guildId, userId });
      if (check && !check.verified) {
        await sent.delete().catch(() => {});
        await message.delete().catch(() => {});
        await Verification.deleteOne({ guildId, userId });
      }
    }, 15 * 60 * 1000); // 15 Minuten
  }
};
