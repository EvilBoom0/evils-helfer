const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "unban",
  description: "Hebt den Bann eines Mitglieds auf und zeigt eine schön designte Bestätigung an.",
  async execute(message, args, client) {
    // Prüfe, ob der ausführende User die nötigen Berechtigungen hat
    if (!message.member.permissions.has("BanMembers")) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler")
        .setDescription("Du hast nicht die Berechtigungen, um Banns aufzuheben.")
        .setColor(0xE74C3C)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const userId = args[0];
    if (!userId) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler")
        .setDescription("Bitte gib die User-ID des Mitglieds an, dessen Bann aufgehoben werden soll.")
        .setColor(0xE74C3C)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    try {
      await message.guild.members.unban(userId);
      const successEmbed = new EmbedBuilder()
        .setTitle("Unban erfolgreich")
        .setDescription(`Mitglied mit der ID \`${userId}\` wurde entbannt.`)
        .setColor(0x2ECC71)
        .setFooter({ text: `Unban durchgeführt von ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
      return message.channel.send({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Unban-Fehler:", error);
      const errorEmbed = new EmbedBuilder()
        .setTitle("Fehler beim Unban")
        .setDescription("Der Unban-Vorgang ist fehlgeschlagen. Überprüfe die ID und ob ich die nötigen Berechtigungen habe.")
        .setColor(0xE74C3C)
        .setTimestamp();
      return message.channel.send({ embeds: [errorEmbed] });
    }
  },
};
