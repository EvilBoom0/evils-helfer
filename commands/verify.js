const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "../data/verificationConfig.json");

module.exports = {
  name: "verify",
  description: "Starte den Verifizierungsprozess",
  async execute(message) {
    if (!fs.existsSync(configPath)) return message.reply("❌ Der Verifizierungsprozess ist nicht eingerichtet.");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (message.channel.id !== config.channelId) return message.reply("⚠️ Bitte nutze den richtigen Verifizierungskanal!");

    const solutions = ["🍎", "🍌", "🍒", "🍇"];
    const correct = solutions[Math.floor(Math.random() * solutions.length)];

    const shuffled = [...solutions].sort(() => 0.5 - Math.random());

    const row = new ActionRowBuilder().addComponents(
      shuffled.map(symbol =>
        new ButtonBuilder()
          .setCustomId(`verify_${symbol}_${correct}_${message.author.id}`)
          .setLabel(symbol)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    const embed = new EmbedBuilder()
      .setTitle("🔐 Verifizierung")
      .setDescription(`Klicke auf **${correct}**, um zu beweisen, dass du kein Bot bist.`)
      .setColor("Blurple");

    await message.reply({ embeds: [embed], components: [row] });
  }
};
