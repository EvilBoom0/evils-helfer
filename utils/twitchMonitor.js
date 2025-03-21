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

async function checkTwitchStatus(twitchChannel) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const oauthToken = process.env.TWITCH_OAUTH_TOKEN;
  const url = `https://api.twitch.tv/helix/streams?user_login=${twitchChannel}`;
  try {
    const response = await fetch(url, {
      headers: {
        "Client-ID": clientId,
        "Authorization": `Bearer ${oauthToken}`
      }
    });
    if (!response.ok) {
      console.error("Twitch API Fehler:", response.statusText);
      return false;
    }
    const data = await response.json();
    return data.data && data.data.length > 0;
  } catch (error) {
    console.error("Fehler beim Überprüfen des Twitch-Status:", error);
    return false;
  }
}

async function sendAnnouncement(client, config) {
  const channel = client.channels.cache.get(config.announcementChannel);
  if (!channel) {
    console.error("Ankündigungskanal nicht gefunden:", config.announcementChannel);
    return;
  }
  const twitchUrl = `https://twitch.tv/${config.twitchChannel}`;
  const previewUrl = `https://static-cdn.jtvnw.net/previews-ttv/live_user${config.twitchChannel.toLowerCase()}-320x180.jpg`;
  const embed = new EmbedBuilder()
    .setTitle(`LIVE NOW: ${config.twitchChannel.toUpperCase()} is streaming!`)
    .setURL(twitchUrl)
    .setDescription(`@everyone, der Stream ist jetzt live!\nKlicke [hier](${twitchUrl}) um beizutreten.`)
    .setImage(previewUrl)
    .setColor(0x9146FF)
    .setTimestamp();
  await channel.send({ content: "@everyone", embeds: [embed] });
}

async function monitorTwitch(client) {
  setInterval(async () => {
    const config = loadConfig();
    if (!config || !config.twitchChannel || !config.announcementChannel) return;
    const isLive = await checkTwitchStatus(config.twitchChannel);
    if (isLive) {
      const now = Date.now();
      if (!config.lastAnnounced || now - config.lastAnnounced >= 30 * 60 * 1000) {
        await sendAnnouncement(client, config);
        config.lastAnnounced = now;
        saveConfig(config);
      }
    }
  }, 60 * 1000);
}

module.exports = { monitorTwitch };
