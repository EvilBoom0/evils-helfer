const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "unban",
  description: "Hebt den Bann eines Mitglieds auf (User-ID oder Erwähnung erforderlich) und sendet eine Einladung per DM.",
  async execute(message, args, client) {
    // Prüfe, ob der Befehlsausführende die Berechtigung hat
    if (!message.member.permissions.has("BanMembers")) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler ❌")
        .setDescription("Du hast nicht die Berechtigungen, um Banns aufzuheben.")
        .setColor("Red")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    let userId = args[0];
    if (!userId) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler ❌")
        .setDescription("Bitte gib die **User-ID** oder erwähne den Nutzer (`@User`), um den Bann aufzuheben.")
        .setColor("Red")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // Falls der Parameter eine Erwähnung ist, extrahiere die reine ID
    if (userId.startsWith("<@") && userId.endsWith(">")) {
      userId = userId.replace(/\D/g, ""); // Entfernt alle Nicht-Zahlen (z.B. "<@!1234567890>" -> "1234567890")
    }

    try {
      // Prüfe, ob der User wirklich gebannt ist
      const banInfo = await message.guild.bans.fetch(userId);
      if (!banInfo) {
        const embed = new EmbedBuilder()
          .setTitle("Fehler ❌")
          .setDescription(`Mitglied mit der ID **${userId}** ist nicht gebannt.`)
          .setColor("Red")
          .setTimestamp();
        return message.channel.send({ embeds: [embed] });
      }

      // Unban durchführen
      await message.guild.members.unban(userId);

      // Einladung-Link (ersetze mit deinem eigenen)
      const inviteLink = "https://discord.gg/Cb8b9HDJkC"; // Hier deinen eigenen Einladungslink einfügen

      // Sende dem Nutzer eine DM, falls möglich
      try {
        const user = await client.users.fetch(userId);
        const dmEmbed = new EmbedBuilder()
          .setTitle("Du wurdest entbannt! 🎉")
          .setDescription(`Du kannst nun wieder dem Server **${message.guild.name}** beitreten!`)
          .addFields({ name: "Einladungslink:", value: `[Klicke hier, um beizutreten](${inviteLink})` })
          .setColor("Green")
          .setFooter({ text: "Unban durch " + message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] });
      } catch (err) {
        console.log(`⚠️ Konnte keine DM an User ${userId} senden.`);
      }

      // Bestätigungsnachricht im Server
      const successEmbed = new EmbedBuilder()
        .setTitle("Unban erfolgreich ✅")
        .setDescription(`Mitglied mit der ID **${userId}** wurde entbannt.`)
        .setColor("Green")
        .setFooter({ text: "Unban ausgeführt von " + message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      return message.channel.send({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Unban-Fehler:", error);
      const errorEmbed = new EmbedBuilder()
        .setTitle("Fehler beim Unban ❌")
        .setDescription(`Der Unban-Vorgang ist fehlgeschlagen. Überprüfe, ob die ID korrekt ist und ob der Nutzer tatsächlich gebannt ist.\n\n**Fehlermeldung:** \`${error.message}\``)
        .setColor("Red")
        .setTimestamp();
      return message.channel.send({ embeds: [errorEmbed] });
    }
  },
};
