module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith("verify_")) {
      const [, chosen, correct, userId] = interaction.customId.split("_");
      if (interaction.user.id !== userId)
        return interaction.reply({ content: "❌ Du darfst diesen Captcha nicht lösen!", ephemeral: true });

      if (chosen === correct) {
        const fs = require("fs");
        const path = require("path");
        const config = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/verificationConfig.json"), "utf8"));
        const role = interaction.guild.roles.cache.get(config.roleId);
        if (!role) return interaction.reply({ content: "❌ Rolle nicht gefunden!", ephemeral: true });

        await interaction.member.roles.add(role);
        return interaction.update({
          content: `✅ Verifizierung erfolgreich! Du hast nun Zugriff.`,
          components: [],
          embeds: [],
        });
      } else {
        return interaction.update({
          content: `❌ Falsche Auswahl! Versuch es erneut mit \`!verify\`.`,
          components: [],
          embeds: [],
        });
      }
    }
  }
};
