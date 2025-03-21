const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const configPath = path.join(__dirname, "../data/twitchConfig.json");

function loadConfig() {
  if (!fs.existsSync(configPath)) return null;
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
}

async function getStreamData(channelName) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const token = process.env.TWITCH_OAUTH_TOKEN;
  const url = `https://api.twitch.tv/helix/streams?user_login=${channelName}`;
  const res = await fetch(url, {
    headers: {
      "Client-ID": clientId,
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    console.error("[Twitch API]", res.statusText);
    return null;
  }

  const data = await res.json();
  return data.data && data.data.length > 0 ? data.data[0] : null;
}

async function sendLiveEmbed(client, config, streamData) {
  const channel = client.channels.cache.get(config.announcementChannel);
  if (!channel) return console.log("❌ Ankündigungskanal nicht gefunden.");

  const embed = new EmbedBuilder()
    .setTitle(`🔴 ${streamData.user_name} ist jetzt LIVE!`)
    .setURL(`https://twitch.tv/${streamData.user_login}`)
    .addFields(
      { name: "📌 Titel", value: streamData.title || "Kein Titel", inline: false },
      { name: "🎮 Kategorie", value: streamData.game_name || "Unbekannt", inline: true },
    )
    .setImage(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${streamData.user_login.toLowerCase()}-640x360.jpg`)
    .setColor(0x9146FF)
    .setTimestamp();

  await channel.send({ content: "@everyone", embeds: [embed] });
}

async function monitorTwitch(client) {
  setInterval(async () => {
    const config = loadConfig();
    if (!config?.twitchChannel || !config?.announcementChannel) return;

    const stream = await getStreamData(config.twitchChannel);
    const now = Date.now();
    const cooldown = 30 * 60 * 1000;

    if (stream && (!config.lastAnnounced || now - config.lastAnnounced > cooldown)) {
      await sendLiveEmbed(client, config, stream);
      config.lastAnnounced = now;
      saveConfig(config);
    }
  }, 60 * 1000);
}

module.exports = { monitorTwitch };
