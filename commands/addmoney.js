const { EmbedBuilder } = require("discord.js");
const { addBalance, getBalance } = require("../utils/cashSystem");

function parseAmount(input) {
  input = input.toLowerCase().trim();
  let multiplier = 1;
  if (input.endsWith("k")) {
    multiplier = 1000;
    input = input.slice(0, -1);
  } else if (input.endsWith("m")) {
    multiplier = 1000000;
    input = input.slice(0, -1);
  }
  const num = parseInt(input);
  return isNaN(num) ? NaN : num * multiplier;
}

module.exports = {
  name: "addmoney",
  description: "Gibt einem Benutzer Geld. (Admin-only)",
  async execute(message, args, client) {
    if (!message.member.permissions.has("Administrator")) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler")
        .setDescription("Du besitzt nicht die nötigen Admin-Rechte, um Geld zu vergeben.")
        .setColor("Red")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }
    const target = message.mentions.members.first();
    if (!target) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler")
        .setDescription("Bitte erwähne den Benutzer, dem du Geld geben möchtest. Beispiel: `!addmoney @User 10k`")
        .setColor("Red")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }
    if (!args[1]) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler")
        .setDescription("Bitte gib einen Betrag an. Beispiel: `!addmoney @User 10k`")
        .setColor("Red")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }
    const amount = parseAmount(args[1]);
    if (isNaN(amount) || amount <= 0) {
      const embed = new EmbedBuilder()
        .setTitle("Fehler")
        .setDescription("Ungültiger Betrag. Verwende z. B. 500, 10k oder 2m.")
        .setColor("Red")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }
    try {
      await addBalance(target.id, amount);
      const newBalance = await getBalance(target.id);
      const embed = new EmbedBuilder()
        .setTitle("Geld hinzugefügt")
        .setDescription(`Du hast <@${target.id}> **${amount} Credits** hinzugefügt.`)
        .addFields({ name: "Neues Guthaben", value: `${newBalance} Credits` })
        .setColor("Green")
        .setFooter({ text: `Admin: ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error("AddMoney-Fehler:", error);
      const embed = new EmbedBuilder()
        .setTitle("Fehler")
        .setDescription("Beim Hinzufügen des Geldes ist ein Fehler aufgetreten.")
        .setColor("Red")
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    }
  }
};
