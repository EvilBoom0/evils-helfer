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

function createSlotEmbed(symbolsArray, bet, userId, status) {
  const display = `---------------------\n| ${symbolsArray[0]} | ${symbolsArray[1]} | ${symbolsArray[2]} |\n---------------------`;
  return new EmbedBuilder()
    .setTitle("🎰 Slot Machine")
    .setDescription(`User: <@${userId}> | Einsatz: ${bet} Credits\n${display}\nStatus: ${status}`)
    .setColor("Gold")
    .setTimestamp();
}

async function spinReel(reelIndex, currentSymbols, sentMessage, bet, userId) {
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    currentSymbols[reelIndex] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
    const embed = createSlotEmbed(currentSymbols, bet, userId, "Spinning...");
    await sentMessage.edit({ embeds: [embed] });
    await sleep(300);
  }
  const finalSymbol = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
  currentSymbols[reelIndex] = finalSymbol;
  const embed = createSlotEmbed(currentSymbols, bet, userId, "Locked");
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

async function createResultEmbed(sentMessage, currentSymbols, bet, userId) {
  const winnings = evaluateResult(currentSymbols, bet);
  const profit = winnings - bet;
  const embed = new EmbedBuilder()
    .setTitle("🎰 Slot Machine Result")
    .setDescription(`Einsatz: ${bet} Credits\n---------------------\n| ${currentSymbols[0]} | ${currentSymbols[1]} | ${currentSymbols[2]} |\n---------------------`)
    .addFields(
      { name: "Ergebnis", value: winnings > 0 ? `Gewinn: ${winnings} Credits` : "❌ YOU LOST", inline: true },
      { name: "Profit", value: `${profit} Credits`, inline: true },
      { name: "Neues Guthaben", value: `Dein Guthaben wurde aktualisiert`, inline: false }
    )
    .setColor(winnings > 0 ? "Green" : "Red")
    .setTimestamp();
  return { embed, winnings, profit };
}

module.exports = {
  name: "slot",
  description: "Spiele die Slot Machine mit Animation.",
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
    let embed = createSlotEmbed(currentSymbols, bet, userId, "Starting...");
    const sentMessage = await message.channel.send({ embeds: [embed] });
    
    for (let i = 0; i < 3; i++) {
      await spinReel(i, currentSymbols, sentMessage, bet, userId);
    }
    
    const { embed: resultEmbed, winnings } = await createResultEmbed(sentMessage, currentSymbols, bet, userId);
    await addBalance(userId, winnings);
    
    // XP wird hier nicht persistent gespeichert, nur angezeigt
    const xpGain = Math.floor(bet / 10) + Math.floor(Math.random() * 5);
    resultEmbed.addFields(
      { name: "Guthaben", value: `Neues Guthaben: ${await getBalance(userId)} Credits`, inline: false },
      { name: "XP", value: `Du hast ${xpGain} XP verdient.`, inline: false }
    );
    
    await sentMessage.edit({ embeds: [resultEmbed] });
  },
};
