const {
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ActionRowBuilder,
  AttachmentBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { generateCaptcha } = require("../utils/captchaApi");
const { userMessages } = require("../events/interactionCreate");

module.exports = {
  name: "verify",
  description: "Startet den Verifizierungsprozess",
  async execute(message, args, client) {
    const configPath = path.join(__dirname, "../data/verificationConfig.json");
    if (!fs.existsSync(configPath)) {
      return message.reply("⚠️ Verifizierung ist nicht eingerichtet. Nutze `!verificationsetup`.");
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!config.channelId || !config.roleId) {
      return message.reply("⚠️ Die Verifizierungskonfiguration ist unvollständig.");
    }

    if (message.channel.id !== config.channelId) {
      return message.reply("⚠️ Verifizierung nur im vorgesehenen Channel möglich.");
    }

    const { image, answer } = await generateCaptcha();
    const attachment = new AttachmentBuilder(image, { name: "captcha.png" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify:correct:${answer}:${message.author.id}`)
        .setLabel("Antwort eingeben")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`captcha:refresh:${message.author.id}`)
        .setLabel("🔁 Neues Captcha")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setTitle("🔐 Verifizierung")
      .setDescription(`Hey <@${message.author.id}>, um Zugang zum Server zu bekommen,\nmusst du das Captcha lösen.`)
      .setImage("attachment://captcha.png")
      .setColor("Blurple")
      .setFooter({
        text: "Verifikation • Powered by Evil's Helfer",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    const botMsg = await message.channel.send({
      content: `<@${message.author.id}>`,
      embeds: [embed],
      components: [row],
      files: [attachment],
    });

    const userMsg = message;

    if (!userMessages.has(message.author.id)) userMessages.set(message.author.id, []);
    userMessages.get(message.author.id).push(botMsg, userMsg);

    setTimeout(() => {
      if (userMessages.has(message.author.id)) {
        for (const msg of userMessages.get(message.author.id)) {
          msg.delete().catch(() => {});
        }
        userMessages.delete(message.author.id);
      }
    }, 15 * 60 * 1000); // 15 Minuten

    return; // Verhindert „Command erfolgreich ausgeführt“-Fehler
  },
};
