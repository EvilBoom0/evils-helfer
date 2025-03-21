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

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.isButton()) {
      const [type, action, expected, userId] = interaction.customId.split("_");

      // NEUES CAPTCHA BUTTON
      if (type === "captcha" && action === "refresh") {
        if (interaction.user.id !== userId)
          return await interaction.reply({
            content: "⛔ Nicht für dich gedacht!",
            ephemeral: true,
          });

        const { image, answer } = await generateCaptcha();
        const attachment = new AttachmentBuilder(image, { name: "captcha.png" });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`verify_correct_${answer}_${interaction.user.id}`)
            .setLabel("Antwort eingeben")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`captcha_refresh_${interaction.user.id}`)
            .setLabel("🔁 Neues Captcha")
            .setStyle(ButtonStyle.Secondary)
        );

        const embed = new EmbedBuilder()
          .setTitle("🔄 Neues Captcha")
          .setDescription(`<@${interaction.user.id}>, gib das neue Captcha ein:`)
          .setColor("Blurple")
          .setImage("attachment://captcha.png")
          .setFooter({
            text: "Verifikation • Powered by Evil's Helfer",
            iconURL: interaction.client.user.displayAvatarURL(),
          });

        return await interaction.update({
          embeds: [embed],
          components: [row],
          files: [attachment],
        });
      }

      // BUTTON → MODAL
      if (type === "verify" && action === "correct") {
        if (interaction.user.id !== userId)
          return await interaction.reply({
            content: "⛔ Nicht für dich gedacht!",
            ephemeral: true,
          });

        const modal = new ModalBuilder()
          .setCustomId(`captcha_submit_${expected}_${userId}`)
          .setTitle("🔐 Captcha eingeben");

        const input = new TextInputBuilder()
          .setCustomId("captcha_input")
          .setLabel("Was steht im Bild?")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        return await interaction.showModal(modal);
      }
    }

    // MODAL SUBMIT (Antwort wurde eingegeben)
    if (interaction.isModalSubmit()) {
      const [type, answer, userId] = interaction.customId.split("_");

      if (type === "captcha") {
        const input = interaction.fields.getTextInputValue("captcha_input");

        if (interaction.user.id !== userId) {
          return await interaction.reply({
            content: "⛔ Nicht für dich gedacht!",
            ephemeral: true,
          });
        }

        const given = input.trim().toLowerCase();
        const correct = answer.trim().toLowerCase();

        if (given === correct) {
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

          setTimeout(() => {
            interaction.message?.delete().catch(() => {});
          }, 3000);
        } else {
          return await interaction.reply({
            content: "❌ Falscher Code. Starte neu mit `!verify`.",
            ephemeral: true,
          });
        }
      }
    }
  },
};
