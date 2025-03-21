const fs = require("fs");
const path = require("path");

module.exports = {
  name: "verificationsetup",
  description: "Setzt den Verifizierungschannel und die Rolle",
  async execute(message, args) {
    const role = message.mentions.roles.first();
    const channel = message.mentions.channels.first();

    if (!role || !channel) {
      return message.reply("Bitte verwende: `!verificationsetup #channel @rolle`");
    }

    const config = {
      channelId: channel.id,
      roleId: role.id
    };

    const filePath = path.join(__dirname, "../data/verificationConfig.json");
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), "utf8");

    return message.reply(`✅ Verifizierungskonfiguration gespeichert!\nChannel: ${channel}\nRolle: ${role}`);
  }
};
