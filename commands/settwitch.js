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

if (args[0] === "setup") {
  const config = loadConfig();
  if (!config.twitchChannel || !config.announcementChannel)
    return message.reply("❌ Twitch-Kanal oder Ankündigungskanal nicht gesetzt.");

  const channel = client.channels.cache.get(config.announcementChannel);
  if (!channel) return message.reply("❌ Der gespeicherte Discord-Channel existiert nicht.");

  const fakeStream = {
    user_name: config.twitchChannel,
    user_login: config.twitchChannel,
    title: "🔥 Test-Stream: Evil's Helfer rockt den Chat!",
    game_name: "Just Chatting"
  };

  const embed = new EmbedBuilder()
    .setTitle(`🔴 ${fakeStream.user_name} ist jetzt LIVE!`)
    .setURL(`https://twitch.tv/${fakeStream.user_login}`)
    .addFields(
      { name: "📌 Titel", value: fakeStream.title, inline: false },
      { name: "🎮 Kategorie", value: fakeStream.game_name, inline: true }
    )
    .setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${fakeStream.user_login.toLowerCase()}-640x360.jpg`)
    .setColor(0x9146FF)
    .setFooter({ text: "Powered by Evil's Helfer Bot", iconURL: client.user.displayAvatarURL() })
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
