const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../data/verificationConfig.json");

module.exports = {
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
      .setFooter({ text: "Sichere Verifizierung aktiviert", iconURL: "https://i.imgur.com/KNnXoTU.png" });

    const sentMsg = await channel.send({ content: `<@${member.id}>`, embeds: [embed] });

    setTimeout(() => {
      sentMsg.delete().catch(() => {});
    }, 60000); // löscht Nachricht nach 60s
  }
};
