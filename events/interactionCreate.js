const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { generateCaptcha } = require("../utils/captchaApi");
const { userMessages } = require("./guildMemberAdd");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isButton()) {
      const [type, action, ...data] = interaction.customId.split(":");

      if (type === "captcha" && action === "refresh") {
        const userId = data[0];
        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: "⛔ Nicht für dich gedacht!",
            ephemeral: true
          });
        }

        const { image, answer } = await generateCaptcha();
        const attachment = new AttachmentBuilder(image, { name: "captcha.png" });

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

        const embed = new EmbedBuilder()
          .setTitle("🔐 Neues Captcha")
          .setDescription(`<@${userId}>, gib den neuen Captcha-Code ein:`)
          .setColor("Blurple")
          .setImage("attachment://captcha.png")
          .setFooter({
            text: "Verifikation • Powered by Evil's Helfer",
            iconURL: interaction.client.user.displayAvatarURL()
          });

        await interaction.update({
          embeds: [embed],
          components: [row],
          files: [attachment]
        });

        return;
      }

      if (type === "verify" && action === "correct") {
        const answer = data[0];
        const userId = data[1];

        if (interaction.user.id !== userId) {
          return interaction.reply({
            content: "⛔ Nicht für dich gedacht!",
            ephemeral: true
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(`verifyModal:${answer}:${userId}`)
          .setTitle("🔐 Captcha Eingabe");

        const input = new TextInputBuilder()
          .setCustomId("captchaInput")
          .setLabel("Gib den Captcha-Code ein")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("z. B. XKD91")
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);

        return;
      }
    }

    if (interaction.isModalSubmit()) {
      const [modalType, expectedAnswer, userId] = interaction.customId.split(":");
      if (modalType !== "verifyModal") return;

      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: "⛔ Nicht für dich gedacht!",
          ephemeral: true
        });
      }

      const userInput = interaction.fields.getTextInputValue("captchaInput").trim();
      const configPath = path.join(__dirname, "../data/verificationConfig.json");

      let config;
      try {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      } catch (e) {
        return interaction.reply({
          content: "❌ Konfigurationsfehler. Bitte informiere einen Admin.",
          ephemeral: true
        });
      }

      const role = interaction.guild.roles.cache.get(config.roleId);
      const isCorrect = userInput.toLowerCase() === expectedAnswer.toLowerCase();

      try {
        if (isCorrect) {
          if (role) await interaction.member.roles.add(role);

          if (userMessages.has(userId)) {
            for (const msg of userMessages.get(userId)) {
              msg.delete().catch(() => {});
            }
            userMessages.delete(userId);
          }

          await interaction.reply({
            content: "✅ Du wurdest erfolgreich verifiziert!",
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: "❌ Falscher Code! Bitte versuche es erneut mit einem neuen Captcha.",
            ephemeral: true
          });
        }
      } catch (err) {
        console.error("Fehler beim Abschicken des Captcha-Modals:", err);
        if (!interaction.replied) {
          await interaction.reply({
            content: "❌ Es ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut.",
            ephemeral: true
          });
        }
      }
    }
  }
};
