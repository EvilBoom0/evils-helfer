const {
  EmbedBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { generateCaptcha } = require("../utils/captchaApi");
const fs = require("fs");
const path = require("path");
const { userMessages } = require("../events/guildMemberAdd");

module.exports = {
  name: "verify",
  description: "Starte den Verifizierungsprozess mit Captcha.",
  async execute(message) {
    const userId = message.author.id;

    const configPath = path.join(__dirname, "../data/verificationConfig.json");
    if (!fs.existsSync(configPath)) {
      return message.reply("⚠️ Der Verifizierungskanal wurde noch nicht eingerichtet. Nutze `!verificationsetup`.");
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (message.channel.id !== config.channelId) {
      return message.reply("⚠️ Du kannst den Verifizierungsprozess nur im Verifizierungskanal starten.");
    }

    const { image, answer } = await generateCaptcha();
    const attachment = new AttachmentBuilder(image, { name: "captcha.png" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify:correct:${answer}:${userId}`)
        .setLabel("Antwort eingeben")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`captcha:refresh:${userId}`)
        .setLabel("🔁 Neues Captcha")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setTitle("🔐 Captcha-Verifizierung")
      .setDescription(`<@${userId}>, gib den Captcha-Code ein:`)
      .setColor("Blurple")
      .setImage("attachment://captcha.png")
      .setFooter({
        text: "Verifikation • Powered by Evil's Helfer",
        iconURL: message.client.user.displayAvatarURL(),
      });

    const msg = await message.channel.send({
      embeds: [embed],
      components: [row],
      files: [attachment],
    });

    try {
      await message.delete().catch(() => {});
    } catch (e) {}

    if (!userMessages.has(userId)) userMessages.set(userId, []);
    userMessages.get(userId).push(msg);

    setTimeout(() => {
      if (userMessages.has(userId)) {
        for (const m of userMessages.get(userId)) m.delete().catch(() => {});
        userMessages.delete(userId);
      }
    }, 15 * 60 * 1000); // 15 Minuten Auto-Cleanup
  },
};
