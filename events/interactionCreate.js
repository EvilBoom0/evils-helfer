const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { generateCaptcha } = require("../utils/captchaApi");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const [type, action, expectedAnswer, userId] = interaction.customId.split("_");

    if (type === "verify" && action === "correct") {
      if (interaction.user.id !== userId) {
        return interaction.reply({ content: "⛔ Das ist nicht für dich gedacht.", ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId(`captcha_submit_${expectedAnswer}_${userId}`)
        .setTitle("🔐 Captcha-Eingabe");

      const input = new TextInputBuilder()
        .setCustomId("captcha_input")
        .setLabel("Gib den Captcha-Text ein")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);

      return await interaction.showModal(modal);
    }

    if (type === "captcha" && action === "refresh") {
      if (interaction.user.id !== expectedAnswer) {
        return interaction.reply({ content: "⛔ Das ist nicht für dich gedacht.", ephemeral: true });
      }

      const { image, answer } = await generateCaptcha();
      const attachment = new AttachmentBuilder(image, { name: "captcha.png" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`verify_correct_${answer}_${interaction.user.id}`)
          .setLabel("Antwort eingeben")
          .setStyle("Success"),
        new ButtonBuilder()
          .setCustomId(`captcha_refresh_${interaction.user.id}`)
          .setLabel("🔁 Neues Captcha")
          .setStyle("Secondary")
      );

      const embed = new EmbedBuilder()
        .setTitle("🔄 Neues Captcha")
        .setDescription(`<@${interaction.user.id}>, hier ist dein neues Captcha.`)
        .setColor("Blurple")
        .setImage("attachment://captcha.png")
        .setFooter({ text: "Verifikation • Powered by Evil's Helfer", iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();

      return await interaction.update({ embeds: [embed], components: [row], files: [attachment] });
    }

    if (interaction.isModalSubmit()) {
      const [modalType, expectedAnswer, userId] = interaction.customId.split("_");

      if (modalType === "captcha" && interaction.user.id === userId) {
        const userInput = interaction.fields.getTextInputValue("captcha_input");

        if (userInput.trim().toLowerCase() === expectedAnswer.trim().toLowerCase()) {
          const configPath = path.join(__dirname, "../data/verificationConfig.json");
          const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

          const role = interaction.guild.roles.cache.get(config.roleId);
          if (role) {
            await interaction.member.roles.add(role).catch(() => {});
          }

          await interaction.update({
            content: `✅ <@${userId}> wurde erfolgreich verifiziert.`,
            embeds: [],
            components: []
          });

          setTimeout(() => {
            interaction.message.delete().catch(() => {});
          }, 3000);
        } else {
          await interaction.reply({
            content: "❌ Falscher Captcha-Code. Bitte versuche es erneut mit `!verify`.",
            ephemeral: true
          });
        }
      }
    }
  }
};
