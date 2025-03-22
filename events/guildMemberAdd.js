const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../data/verificationConfig.json");

const userMessages = new Map(); // Exportieren wir gleich mit für die Interaktion

module.exports = {
  userMessages,
  name: "guildMemberAdd",
  async execute(member) {
    if (!fs.existsSync(configPath)) return;
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const channel = member.guild.channels.cache.get(config.channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle("👋 Willkommen auf dem Server!")
      .setDescription(`Hey <@${member.id}>, um Zugriff auf den Server zu bekommen, musst du kurz beweisen, dass du kein Bot bist.\n\n**Gib einfach \`!verify\` hier im Channel ein!**`)
      .setColor("Blurple")
      .setFooter({
        text: "Verifikation • Powered by Evil's Helfer",
            iconURL: interaction.client.user.displayAvatarURL()
      });

    const sentMsg = await channel.send({ content: `<@${member.id}>`, embeds: [embed] });

    // Speichern für spätere automatische Löschung
    if (!userMessages.has(member.id)) userMessages.set(member.id, []);
    userMessages.get(member.id).push(sentMsg);

    // Löschen nach 15 Minuten falls nicht verifiziert
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
