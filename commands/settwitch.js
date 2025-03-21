const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../data/twitchConfig.json");

function loadConfig() {
  if (!fs.existsSync(configPath)) return { twitchChannel: null, announcementChannel: null, lastAnnounced: null };
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}

module.exports = {
  name: "settwitch",
  description: "Setzt den Twitch-Channel und den Discord-Ankündigungskanal. Verwendung: !settwitch <twitchChannel> <discordChannelId>",
  async execute(message, args) {
    if (!message.member.permissions.has("ManageGuild"))
      return message.reply("Du hast keine Berechtigung, diesen Befehl zu verwenden.");
    if (args.length < 2)
      return message.reply("Bitte gib den Twitch-Kanal und die Discord-Channel-ID an. Beispiel: `!settwitch mytwitchchannel 123456789012345678`");
    const twitchChannel = args[0].toLowerCase();
    const announcementChannel = args[1];
    let config = loadConfig();
    config.twitchChannel = twitchChannel;
    config.announcementChannel = announcementChannel;
    config.lastAnnounced = null;
    saveConfig(config);
    const embed = new EmbedBuilder()
      .setTitle("Twitch-Konfiguration aktualisiert")
      .setDescription(`Twitch-Kanal: **${twitchChannel}**\nAnkündigungskanal: <#${announcementChannel}>`)
      .setColor("Green")
      .setTimestamp();
    return message.channel.send({ embeds: [embed] });
  }
};
