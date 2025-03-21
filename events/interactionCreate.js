const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../data/verificationConfig.json");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith("verify_correct_")) {
      const [, , correctAnswer, userId] = interaction.customId.split("_");
      if (interaction.user.id !== userId) {
        return interaction.reply({ content: "❌ Das ist nicht dein Captcha!", ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId(`modal_${correctAnswer}_${userId}`)
        .setTitle("Captcha Eingabe");

      const input = new TextInputBuilder()
        .setCustomId("captcha_response")
        .setLabel("Was steht im Bild?")
        .setStyle(TextInputStyle.Short);

      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);

      await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
      const [prefix, correctAnswer, userId] = interaction.customId.split("_");
      if (prefix !== "modal" || interaction.user.id !== userId) return;

      const userAnswer = interaction.fields.getTextInputValue("captcha_response");
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const role = interaction.guild.roles.cache.get(config.roleId);
      if (!role) return interaction.reply({ content: "❌ Rolle nicht gefunden!", ephemeral: true });

      if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        await interaction.member.roles.add(role);
        await interaction.reply({ content: `✅ Verifizierung erfolgreich! Willkommen <@${interaction.user.id}>`, ephemeral: true });
      } else {
        await interaction.reply({ content: "❌ Falsche Antwort! Versuch es erneut mit `!verify`.", ephemeral: true });
      }
    }
  }
};
