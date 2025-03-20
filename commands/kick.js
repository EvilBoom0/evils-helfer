const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "kick",
  description: "Kickt ein Mitglied mit Begründung und schickt eine DM.",
  async execute(message, args, client) {
    // Prüfe, ob der ausführende User Kick-Berechtigungen hat
    if (!message.member.permissions.has("KickMembers")) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler ❌")
        .setDescription("Du hast nicht die Berechtigung, Mitglieder zu kicken.")
        .setColor("Red")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // Prüfe, ob ein Mitglied erwähnt wurde
    const member = message.mentions.members.first();
    if (!member) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler ❌")
        .setDescription("Bitte erwähne ein Mitglied, das gekickt werden soll (`!kick @User [Grund]`).")
        .setColor("Red")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // Prüfe, ob der Bot den User kicken kann (Rollen-Hierarchie)
    if (!member.kickable) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler ❌")
        .setDescription("Ich kann diesen User nicht kicken! Möglicherweise hat er eine höhere Rolle als ich.")
        .setColor("Red")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // Grund für den Kick aus den Argumenten extrahieren
    const reason = args.slice(1).join(" ") || "Kein Grund angegeben";

    // Erstelle das DM-Embed für den gekickten User
    const dmEmbed = new EmbedBuilder()
      .setTitle("Du wurdest gekickt! 🚪")
      .setDescription(`Du wurdest aus **${message.guild.name}** entfernt.`)
      .addFields({ name: "Grund:", value: reason })
      .setColor("Orange")
      .setFooter({ text: "Kick ausgeführt von " + message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    // Versuche, dem User eine DM zu schicken
    try {
      await member.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.log(`⚠️ Konnte keine DM an ${member.user.tag} senden.`);
    }

    // Versuche, den User zu kicken
    try {
      await member.kick(reason);
      const successEmbed = new EmbedBuilder()
        .setTitle("Mitglied gekickt ✅")
        .setDescription(`**${member.user.tag}** wurde aus dem Server entfernt.`)
        .addFields({ name: "Grund:", value: reason })
        .setColor("Orange")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "Kick ausgeführt von " + message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      return message.channel.send({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Kick-Fehler:", error);
      const errorEmbed = new EmbedBuilder()
        .setTitle("Fehler beim Kick ❌")
        .setDescription(`Der Kick-Vorgang ist fehlgeschlagen. Überprüfe, ob ich die nötigen Berechtigungen habe.\n\n**Fehlermeldung:** \`${error.message}\``)
        .setColor("Red")
        .setTimestamp();
      return message.channel.send({ embeds: [errorEmbed] });
    }
  },
};
