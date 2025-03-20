const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "unban",
  description: "Hebt den Bann eines Mitglieds auf (User-ID erforderlich).",
  async execute(message, args, client) {
    // Prüfe Berechtigung
    if (!message.member.permissions.has("BanMembers")) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler")
        .setDescription("Du hast keine Berechtigung, Banns aufzuheben.")
        .setColor("Red")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const userId = args[0];
    if (!userId) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler")
        .setDescription("Bitte gib die User-ID des Mitglieds an, dessen Bann aufgehoben werden soll.")
        .setColor("Red")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    try {
      // Versuche, den Bann für die angegebene User-ID zu holen.
      const banInfo = await message.guild.bans.fetch(userId);
      if (!banInfo) {
        const embed = new EmbedBuilder()
          .setTitle("Fehler")
          .setDescription(`Mitglied mit der ID \`${userId}\` ist nicht gebannt.`)
          .setColor("Red")
          .setTimestamp();
        return message.channel.send({ embeds: [embed] });
      }

      // Falls gebannt, hebe den Bann auf.
      await message.guild.members.unban(userId);
      const successEmbed = new EmbedBuilder()
        .setTitle("Unban erfolgreich")
        .setDescription(`Mitglied mit der ID \`${userId}\` wurde entbannt.`)
        .setColor("Green")
        .setFooter({ text: `Unban ausgeführt von ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
      return message.channel.send({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Unban-Fehler:", error);
      const errorEmbed = new EmbedBuilder()
        .setTitle("Fehler beim Unban")
        .setDescription(`Der Unban-Vorgang ist fehlgeschlagen. Überprüfe, ob die ID korrekt ist und ob der Nutzer tatsächlich gebannt ist.\nFehler: \`${error.message}\``)
        .setColor("Red")
        .setTimestamp();
      return message.channel.send({ embeds: [errorEmbed] });
    }
  },
};
