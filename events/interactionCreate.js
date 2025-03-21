const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { generateCaptcha } = require("../utils/captchaApi");
const fs = require("fs");
const path = require("path");

const userMessages = new Map(); // speichert Nachrichten pro User zum Löschen

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.isButton()) {
      const [type, action, answerOrId, userId] = interaction.customId.split("_");

      if (type === "captcha" && action === "refresh") {
        if (interaction.user.id !== userId)
          return interaction.reply({ content: "⛔ Nicht für dich gedacht!", ephemeral: true });

        const { image, answer } = await generateCaptcha();
        const attachment = new AttachmentBuilder(image, { name: "captcha.png" });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`verify_correct_${answer}_${userId}`)
            .setLabel("Antwort eingeben")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`captcha_refresh_${userId}`)
            .setLabel("🔁 Neues Captcha")
            .setStyle(ButtonStyle.Secondary)
        );

        const embed = new EmbedBuilder()
          .setTitle("🔐 Neues Captcha")
          .setDescription(`<@${userId}>, gib das neue Captcha ein:`)
          .setColor("Blurple")
          .setImage("attachment://captcha.png")
          .setFooter({
            text: "Verifikation • Powered by Evil's Helfer",
            iconURL: interaction.client.user.displayAvatarURL(),
          });

        await interaction.update({
          embeds: [embed],
          components: [row],
          files: [attachment],
        });

        return;
      }

      if (type === "verify" && action === "correct") {
        if (interaction.user.id !== userId)
          return interaction.reply({ content: "⛔ Nicht für dich gedacht!", ephemeral: true });

        const modal = new ModalBuilder()
          .setCustomId(`captcha_submit_${answerOrId}_${userId}`)
          .setTitle("🔐 Captcha eingeben");

        const input = new TextInputBuilder()
          .setCustomId("captcha_input")
          .setLabel("Was steht im Bild?")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await interaction.showModal(modal);
        return;
      }
    }

    if (interaction.isModalSubmit()) {
      const [type, correctAnswer, userId] = interaction.customId.split("_");
      if (type !== "captcha" || interaction.user.id !== userId) return;

      const userInput = interaction.fields.getTextInputValue("captcha_input")?.trim()?.toLowerCase();
      if (userInput !== correctAnswer.toLowerCase()) {
        return await interaction.reply({
          content: "❌ Falscher Code. Starte neu mit `!verify`.",
          ephemeral: true,
        });
      }

      // ✅ Richtig beantwortet
      const configPath = path.join(__dirname, "../data/verificationConfig.json");
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const role = interaction.guild.roles.cache.get(config.roleId);

      if (role) {
        await interaction.member.roles.add(role).catch(() => {});
      }

      await interaction.reply({
        content: `✅ <@${userId}> erfolgreich verifiziert!`,
        ephemeral: false,
      });

      // 🧹 Nachrichten löschen
      const userMsgData = userMessages.get(userId);
      if (userMsgData) {
        for (const msg of userMsgData) {
          msg.delete().catch(() => {});
        }
        userMessages.delete(userId);
      }
    }
  },
};

// Zum Speichern von Nachrichten aus verify.js (Ergänzung dort)
module.exports.userMessages = userMessages;
