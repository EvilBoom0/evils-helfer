const { EmbedBuilder } = require("discord.js");
const { getBalance, addBalance, removeBalance } = require("../utils/cashSystem");

const symbols = ["🍒", "🍋", "🍉", "💎", "💰", "🥇", "💯", "🎰", "🔔"];
const weightedSymbols = [
  "🍒", "🍒", "🍒", "🍒", "🍒", "🍋", "🍋", "🍋", "🍉", "💎", "💰", "🥇", "💯", "🎰", "🔔"
];

const multipliers = {
  "🍒🍒🍒": 2,  
  "🍋🍋🍋": 3,  
  "🍉🍉🍉": 5,  
  "💎💎💎": 10,  
  "💰💰💰": 100,  
  "🥇🥇🥇": 1000,  
  "💯💯💯": 10000  
};

const smallWins = {
  "🍒🍒": 1.2,   
  "🍋🍋": 1.5,   
  "🍉🍉": 2,     
  "💎💎": 3,     
};

async function spinSlots(sentMessage, userId, bet) {
  let slots = ["❓", "❓", "❓"];
  
  for (let step = 0; step < 5; step++) { 
    slots = [
      weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)],
      weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)],
      weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)]
    ];

    const embed = new EmbedBuilder()
      .setTitle(`🎰 Slot Machine | ${userId}`)
      .setDescription(`Einsatz: ${bet} Credits\n---------------------\n| ${slots[0]} | ${slots[1]} | ${slots[2]} |\n---------------------\n*Die Slots drehen sich...*`)
      .setColor("Gold");

    await sentMessage.edit({ embeds: [embed] });
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return slots;
}

function calculateWinnings(slotResult, bet) {
  const resultString = slotResult.join("");

  if (multipliers[resultString]) return bet * multipliers[resultString];

  for (const smallWin in smallWins) {
    if (resultString.includes(smallWin)) return bet * smallWins[smallWin];
  }

  return 0;
}

module.exports = {
  name: "slot",
  description: "Spiele die Slot Machine!",
  aliases: ["s"],

  async execute(message, args, client) {
    const userId = message.author.id;
    const bet = parseInt(args[0]) || 100;

    if (bet <= 0 || isNaN(bet)) return message.reply("❌ Ungültiger Einsatz!");
    if (await getBalance(userId) < bet) return message.reply("❌ Du hast nicht genug Credits!");

    await removeBalance(userId, bet);

    const embed = new EmbedBuilder()
      .setTitle(`🎰 Slot Machine | ${message.author.username}`)
      .setDescription(`Einsatz: ${bet} Credits\n*Die Slots drehen sich...*`)
      .setColor("Gold");

    const sentMessage = await message.channel.send({ embeds: [embed] });

    const slotResult = await spinSlots(sentMessage, userId, bet);
    const winnings = calculateWinnings(slotResult, bet);
    const profit = winnings - bet;

    await addBalance(userId, winnings);

    embed.setDescription(`**Einsatz:** ${bet} Credits\n---------------------\n| ${slotResult[0]} | ${slotResult[1]} | ${slotResult[2]} |\n---------------------`)
      .addFields(
        { name: "🎲 Ergebnis", value: winnings > 0 ? `💰 **Gewinn:** ${winnings} Credits` : "❌ **YOU LOST**" },
        { name: "💸 Profit", value: `${profit} Credits`, inline: true },
        { name: "💳 Guthaben", value: `Du hast nun **${await getBalance(userId)} Credits**`, inline: false }
      )
      .setColor(winnings > 0 ? "Green" : "Red");

    await sentMessage.edit({ embeds: [embed] });
  },
};
