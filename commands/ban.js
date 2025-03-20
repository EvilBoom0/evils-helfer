const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "bann",
  description: "Bannt einen Benutzer vom Server mit einem angegebenen Grund und sendet ihm eine DM.",
  async execute(message, args, client) {
    // Prüfe, ob der Aufrufer die Berechtigung "Mitglieder bannen" hat
    if (!message.member.permissions.has("BanMembers")) {
      return message.reply("Du hast keine Berechtigung, Mitglieder zu bannen.");
    }
    
    // Versuche den zu bannenden Benutzer aus der Erwähnung oder der ID zu ermitteln
    const userToBan = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!userToBan) {
      return message.reply("Bitte erwähne einen gültigen Benutzer, den du bannen möchtest.");
    }
    
    // Extrahiere den Grund aus den Argumenten
    const reason = args.slice(1).join(" ") || "Kein Grund angegeben";
    
    // Erstelle einen Embed für die DM an den zu bannenden Benutzer
    const dmEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("Ban Notification")
      .setDescription(`Du wurdest vom Server **${message.guild.name}** gebannt.\n**Grund:** ${reason}`)
      .setImage("https://i.imgur.com/KNnXoTU.png") // Ersetze diese URL durch ein passendes Bild
      .setTimestamp();
    
    // Erstelle einen Embed für die Bestätigung im Kanal
    const channelEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("Mitglied Gebannt")
      .setDescription(`**${userToBan.user.tag}** wurde vom Server gebannt.\n**Grund:** ${reason}`)
      .setThumbnail(userToBan.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();
    
    // Sende eine DM an den zu bannenden Benutzer
    try {
      await userToBan.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.log("Konnte DM nicht senden: ", err);
    }
    
    // Versuche, den Benutzer zu bannen
    try {
      await userToBan.ban({ reason: reason });
      message.channel.send({ embeds: [channelEmbed] });
    } catch (err) {
      console.error("Fehler beim Bann: ", err);
      message.reply("Es gab einen Fehler beim Bann des Benutzers.");
    }
  },
};
