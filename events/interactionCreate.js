if (interaction.isModalSubmit()) {
  const [modalType, expectedAnswer, userId] = interaction.customId.split(":");
  if (modalType !== "verifyModal") return;

  if (interaction.user.id !== userId) {
    return interaction.reply({
      content: "⛔ Nicht für dich gedacht!",
      ephemeral: true,
    });
  }

  const userInput = interaction.fields.getTextInputValue("captchaInput").trim();
  const configPath = path.join(__dirname, "../data/verificationConfig.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const role = interaction.guild.roles.cache.get(config.roleId);

  const isCorrect = userInput.toLowerCase() === expectedAnswer.toLowerCase();

  try {
    if (isCorrect) {
      if (role) {
        await interaction.member.roles.add(role).catch(console.error);
      }

      if (userMessages.has(userId)) {
        for (const msg of userMessages.get(userId)) {
          msg.delete().catch(() => {});
        }
        userMessages.delete(userId);
      }

      await interaction.reply({
        content: "✅ Du wurdest erfolgreich verifiziert!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "❌ Falscher Code! Bitte versuche es erneut mit einem neuen Captcha.",
        ephemeral: true,
      });
    }
  } catch (err) {
    console.error("Fehler beim Abschicken des Captcha-Modals:", err);
    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Es ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut.",
        ephemeral: true,
      });
    }
  }
}
