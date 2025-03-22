const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../data/verificationConfig.json");

const userMessages = new Map(); // für automatische Löschung & Zugriff von interactionCreate.js

module.exports = {
  userMessages,
  name: "guildMemberAdd",
  async execute(member) {
    if (!fs.existsSync(configPath)) return;

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const channel = member.guild.channels.cache.get(config.channelId);
    if (!channel) return;

    const botAvatar = member.client.user.displayAvatarURL();

    const embed = new EmbedBuilder()
      .setTitle("👋 Willkommen auf dem Server!")
      .setDescription(`Hey <@${member.id}>, um Zugriff auf den Server zu bekommen, musst du kurz beweisen, dass du kein Bot bist.\n\n**Gib einfach \`!verify\` hier im Channel ein!**`)
      .setColor("Blurple")
      .setFooter({
        text: "Verifikation • Powered by Evil's Helfer",
        iconURL: botAvatar
      });

    const sentMsg = await channel.send({ content: `<@${member.id}>`, embeds: [embed] });

    // Nachricht merken für spätere Löschung
    if (!userMessages.has(member.id)) userMessages.set(member.id, []);
    userMessages.get(member.id).push(sentMsg);

    // Löscht alle Nachrichten nach 15 Minuten (wenn nicht verifiziert)
    setTimeout(() => {
      if (userMessages.has(member.id)) {
        for (const msg of userMessages.get(member.id)) {
          msg.delete().catch(() => {});
        }
        userMessages.delete(member.id);
      }
    }, 15 * 60 * 1000);
  }
};
