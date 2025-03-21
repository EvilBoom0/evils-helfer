const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../data/verificationConfig.json");

function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf8");
}

module.exports = {
  name: "verificationsetup",
  description: "Setzt den Verifizierungschannel und die Rolle. Beispiel: !verificationsetup #channel @rolle",
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator"))
      return message.reply("❌ Du brauchst Administrator-Rechte.");

    const channel = message.mentions.channels.first();
    const role = message.mentions.roles.first();

    if (!channel || !role) return message.reply("❌ Syntax: `!verificationsetup #channel @rolle`");

    const config = {
      guildId: message.guild.id,
      channelId: channel.id,
      roleId: role.id,
    };

    saveConfig(config);

    return message.reply(`✅ Verifizierung konfiguriert!\nChannel: <#${channel.id}>\nRolle: <@&${role.id}>`);
  }
};
