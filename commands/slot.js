const { EmbedBuilder } = require("discord.js");
const { getBalance, removeBalance, addBalance } = require("../utils/cashSystem");

const weightedSymbols = [
  "🍒","🍒","🍒","🍒","🍒","🍒","🍒","🍒","🍒","🍒",
  "🍋","🍋","🍋","🍋","🍋","🍋","🍋","🍋",
  "🍉","🍉","🍉","🍉","🍉",
  "💎","💎","💎",
  "💰","💰",
  "🥇",
  "💯",
  "🎰","🎰","🎰",
  "🔔","🔔","🔔"
];

const threeMultiplier = {
  "🍒": 3,
  "🍋": 5,
  "🍉": 10,
  "💎": 25,
  "💰": 100,
  "🥇": 1000,
  "💯": 10000,
  "🎰": 8,
  "🔔": 8
};

const twoMultiplier = {
  "🍒": 1.2,
  "🍋": 1.5,
  "🍉": 2,
  "💎": 3,
  "💰": 5,
  "🥇": 10,
  "💯": 20,
  "🎰": 1.5,
  "🔔": 1.5
};

const houseEdgeFactor = 0.5;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function createSlotEmbed(symbolsArray, bet, userId, infoText) {
  const display = `---------------------\n| ${symbolsArray[0]} | ${symbolsArray[1]} | ${symbolsArray[2]} |\n---------------------`;
  return new EmbedBuilder()
    .setTitle("🎰 Slot Machine")
    .setDescription(`Einsatz: ${bet} Credits\n${display}\n${infoText}`)
    .setColor("Gold")
    .setTimestamp();
}

async function spinReel(reelIndex, currentSymbols, sentMessage, bet, userId) {
  const steps = 6; // Weniger Schritte für schnellere Animation
  for (let i = 0; i < steps; i++) {
    currentSymbols[reelIndex] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
    const embed = createSlotEmbed(currentSymbols, bet, userId, "Drehen...");
    await sentMessage.edit({ embeds: [embed] });
    await sleep(200);
  }
  const finalSymbol = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
  currentSymbols[reelIndex] = finalSymbol;
  const embed = createSlotEmbed(currentSymbols, bet, userId, "Fertig");
  await sentMessage.edit({ embeds: [embed] });
  return finalSymbol;
}

function evaluateResult(symbolsArray, bet) {
  if (symbolsArray[0] === symbolsArray[1] && symbolsArray[1] === symbolsArray[2]) {
    return bet * (threeMultiplier[symbolsArray[0]] || 0) * houseEdgeFactor;
  }
  if (symbolsArray[0] === symbolsArray[1]) {
    return bet * (twoMultiplier[symbolsArray[0]] || 0) * houseEdgeFactor;
  }
  if (symbolsArray[1] === symbolsArray[2]) {
    return bet * (twoMultiplier[symbolsArray[1]] || 0) * houseEdgeFactor;
  }
  return 0;
}

async function createResultEmbed(sentMessage, currentSymbols, bet, userId, newBalance, xpGain) {
  const winnings = evaluateResult(currentSymbols, bet);
  const profit = winnings - bet;
  const embed = new EmbedBuilder()
    .setTitle("🎰 Slot Machine Ergebnis")
    .setDescription(`Einsatz: ${bet} Credits\n---------------------\n| ${currentSymbols[0]} | ${currentSymbols[1]} | ${currentSymbols[2]} |\n---------------------`)
    .addFields(
      { name: "Ergebnis", value: winnings > 0 ? `Gewinn: ${winnings} Credits` : "❌ Verloren", inline: true },
      { name: "Profit", value: `${profit} Credits`, inline: true },
      { name: "Neues Guthaben", value: `${newBalance} Credits`, inline: false },
      { name: "XP", value: `+${xpGain}`, inline: true }
    )
    .setColor(winnings > 0 ? "Green" : "Red")
    .setTimestamp();
  return embed;
}

module.exports = {
  name: "slot",
  description: "Spiele die Slot Machine.",
  aliases: ["s"],
  async execute(message, args, client) {
    const userId = message.author.id;
    const bet = parseInt(args[0]) || 100;
    if (bet <= 0 || isNaN(bet)) return message.reply("Ungültiger Einsatz!");
    const { getBalance, removeBalance, addBalance } = require("../utils/cashSystem");
    const currentBalance = await getBalance(userId);
    if (currentBalance < bet) return message.reply("Nicht genug Credits!");

    await removeBalance(userId, bet);
    let currentSymbols = ["❓", "❓", "❓"];
    let embed = createSlotEmbed(currentSymbols, bet, userId, "Wird gedreht...");
    const sentMessage = await message.channel.send({ embeds: [embed] });

    for (let i = 0; i < 3; i++) {
      await spinReel(i, currentSymbols, sentMessage, bet, userId);
    }
    const winnings = evaluateResult(currentSymbols, bet);
    const profit = winnings - bet;
    await addBalance(userId, winnings);
    const newBalance = await getBalance(userId);
    const xpGain = Math.floor(bet / 10) + Math.floor(Math.random() * 5);
    const resultEmbed = await createResultEmbed(sentMessage, currentSymbols, bet, userId, newBalance, xpGain);
    await sentMessage.edit({ embeds: [resultEmbed] });
    console.log(`Slot for ${userId}: ${currentSymbols.join(" | ")} | Bet: ${bet} | Win: ${winnings} | Profit: ${profit}`);
  },
};
