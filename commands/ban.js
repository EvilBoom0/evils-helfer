const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ban",
  description: "Bannt ein Mitglied und sendet eine hübsch gestaltete Nachricht sowie eine DM.",
  async execute(message, args, client) {
    // Prüfe, ob der ausführende User die nötigen Berechtigungen hat
    if (!message.member.permissions.has("BanMembers")) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler")
        .setDescription("Du hast nicht die erforderlichen Berechtigungen, um Mitglieder zu bannen.")
        .setColor(0xE74C3C)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // Prüfe, ob ein Mitglied erwähnt wurde
    const member = message.mentions.members.first();
    if (!member) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler")
        .setDescription("Bitte erwähne ein Mitglied, das gebannt werden soll.")
        .setColor(0xE74C3C)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // Grund aus den Argumenten (ohne die Erwähnung)
    const reason = args.slice(1).join(" ") || "Kein Grund angegeben";

    // Erstelle das DM-Embed für den zu bannenden User
    const dmEmbed = new EmbedBuilder()
      .setTitle("Du wurdest gebannt!")
      .setDescription(`Du wurdest in **${message.guild.name}** gebannt.`)
      .addFields(
        { name: "Grund", value: reason }
      )
      .setColor(0x9B59B6)
      .setImage("https://i.imgur.com/KNnXoTU.png")
      .setFooter({ text: `Gebannt von ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    try {
      await member.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.log(`Konnte keine DM an ${member.user.tag} senden.`);
    }

    // Versuche, das Mitglied zu bannen
    try {
      await member.ban({ reason });
      const successEmbed = new EmbedBuilder()
        .setTitle("Mitglied gebannt")
        .setDescription(`**${member.user.tag}** wurde gebannt.`)
        .addFields(
          { name: "Grund", value: reason }
        )
        .setColor(0x2ECC71)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setImage("https://i.imgur.com/KNnXoTU.png")
        .setFooter({ text: `Gebannt von ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
      return message.channel.send({ embeds: [successEmbed] });
    } catch (error) {
      console.error("Ban-Fehler:", error);
      const errorEmbed = new EmbedBuilder()
        .setTitle("Fehler beim Bannen")
        .setDescription("Der Bannvorgang ist fehlgeschlagen. Stelle sicher, dass ich die nötigen Berechtigungen habe.")
        .setColor(0xE74C3C)
        .setTimestamp();
      return message.channel.send({ embeds: [errorEmbed] });
    }
  },
};
