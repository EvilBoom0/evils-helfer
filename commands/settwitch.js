const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../data/twitchConfig.json");

function loadConfig() {
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}

module.exports = {
  name: "settwitch",
  description: "Setze den Twitch-Kanal und Discord-Channel für Live-Benachrichtigungen",
  async execute(message, args, client) {
    if (!message.member.permissions.has("ManageGuild"))
      return message.reply("❌ Du brauchst `Manage Server`, um das zu tun.");

    if (!args[0]) return message.reply("⚠️ Gib einen Twitch-Kanal an.");
    if (args[0] === "setup") {
      const config = loadConfig();
      if (!config.twitchChannel || !config.announcementChannel)
        return message.reply("❌ Twitch-Kanal oder Ankündigungskanal nicht gesetzt.");
      const channel = client.channels.cache.get(config.announcementChannel);
      if (!channel) return message.reply("❌ Der gespeicherte Discord-Channel existiert nicht.");
      const embed = new EmbedBuilder()
        .setTitle("✅ Testnachricht")
        .setDescription(`Wenn dieser Embed ankommt, ist alles korrekt eingerichtet!`)
        .setURL(`https://twitch.tv/${config.twitchChannel}`)
        .setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${config.twitchChannel.toLowerCase()}-320x180.jpg`)
        .setColor(0x9146FF)
        .setTimestamp();
      return channel.send({ content: "@everyone", embeds: [embed] });
    }

    const twitchChannel = args[0].toLowerCase();
    const discordChannelId = args[1];

    if (!client.channels.cache.get(discordChannelId))
      return message.reply("❌ Ungültige Discord-Channel-ID.");

    const config = {
      twitchChannel,
      announcementChannel: discordChannelId,
      lastAnnounced: null
    };
    saveConfig(config);

    const embed = new EmbedBuilder()
      .setTitle("✅ Twitch-Konfiguration gespeichert")
      .setDescription(`**Twitch-Kanal:** ${twitchChannel}\n**Discord-Channel:** <#${discordChannelId}>`)
      .setColor("Green")
      .setTimestamp();
    message.channel.send({ embeds: [embed] });
  }
};
