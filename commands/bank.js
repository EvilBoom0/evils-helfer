const { EmbedBuilder } = require("discord.js");
const User = require("../models/user");

module.exports = {
  name: "bank",
  description: "Verwalte dein Bankkonto!",
  aliases: ["b"],

  async execute(message, args) {
    const userId = message.author.id;
    let user = await User.findOne({ userId });

    if (!user) {
      user = new User({ userId });
      await user.save();
    }

    const action = args[0]; // "einzahlen", "abheben", "upgrade"
    const amount = parseInt(args[1]);

    if (action === "einzahlen") {
      if (isNaN(amount) || amount <= 0) return message.reply("❌ Ungültiger Betrag!");
      if (user.credits < amount) return message.reply("❌ Du hast nicht genug Bargeld!");
      if (user.bank + amount > user.bankLimit) return message.reply(`❌ Dein Banklimit von ${user.bankLimit} Credits ist erreicht!`);

      user.credits -= amount;
      user.bank += amount;
      await user.save();

      return message.channel.send(`💰 **${amount} Credits eingezahlt!** Neues Bankguthaben: ${user.bank}`);
    }

    if (action === "abheben") {
      if (isNaN(amount) || amount <= 0) return message.reply("❌ Ungültiger Betrag!");
      if (user.bank < amount) return message.reply("❌ Du hast nicht genug auf der Bank!");

      user.credits += amount;
      user.bank -= amount;
      await user.save();

      return message.channel.send(`🏦 **${amount} Credits abgehoben!** Neues Bargeld: ${user.credits}`);
    }

    if (action === "upgrade") {
      const cost = user.bankLimit * 0.5; // Upgrade kostet 50% vom aktuellen Limit
      if (user.credits < cost) return message.reply(`❌ Du brauchst ${cost} Credits für ein Upgrade!`);
      
      user.credits -= cost;
      user.bankLimit += 1000; // Limit um 1000 erhöhen
      await user.save();

      return message.channel.send(`🔼 **Banklimit erhöht!** Neues Limit: ${user.bankLimit} Credits`);
    }

    const embed = new EmbedBuilder()
      .setTitle(`🏦 Bankkonto von ${message.author.username}`)
      .setDescription(`💰 Bargeld: ${user.credits}\n🏦 Bank: ${user.bank}/${user.bankLimit}`)
      .addFields(
        { name: "Einzahlen", value: "`!bank einzahlen <Betrag>`", inline: true },
        { name: "Abheben", value: "`!bank abheben <Betrag>`", inline: true },
        { name: "Upgrade", value: "`!bank upgrade`", inline: true }
      )
      .setColor("Gold");

    return message.channel.send({ embeds: [embed] });
  },
};
