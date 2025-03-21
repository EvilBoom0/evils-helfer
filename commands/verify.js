const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { generateCaptcha } = require('../utils/captchaApi');
const verificationState = new Map();

module.exports = {
  name: 'verify',
  description: 'Startet den Verifizierungsprozess.',
  async execute(message) {
    const userId = message.author.id;
    const guildId = message.guild.id;
    const key = `${guildId}-${userId}`;

    if (verificationState.has(key)) {
      return message.reply("⚠️ Du befindest dich bereits im Verifizierungsprozess!");
    }

    const { buffer, text, filePath } = await generateCaptcha();
    if (!buffer || !text) {
      return message.reply("❌ Ein Fehler ist aufgetreten. Bitte informiere den Admin.");
    }

    const captchaEmbed = new EmbedBuilder()
      .setTitle("🔒 Verifizierung")
      .setDescription(`${message.author}, gib den Text aus dem Captcha ein, um Zugriff zum Server zu erhalten.`)
      .setImage('attachment://captcha.png')
      .setFooter({ text: "Powered by Evil's Helfer", iconURL: message.client.user.displayAvatarURL() })
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`newCaptcha_${userId}`)
        .setLabel("🔄 Neues Captcha")
        .setStyle(ButtonStyle.Secondary)
    );

    const sentMessage = await message.channel.send({
      content: `${message.author}`,
      embeds: [captchaEmbed],
      files: [new AttachmentBuilder(buffer, { name: "captcha.png" })],
      components: [row]
    });

    verificationState.set(key, {
      expected: text,
      messageId: sentMessage.id,
      createdAt: Date.now(),
      channelId: message.channel.id
    });

    setTimeout(() => {
      if (verificationState.has(key)) {
        verificationState.delete(key);
        sentMessage.delete().catch(() => {});
      }
    }, 15 * 60 * 1000); // 15 Minuten
  },
  verificationState
};
