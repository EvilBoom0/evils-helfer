const { EmbedBuilder } = require("discord.js");
const { getBalance, removeBalance, addBalance } = require("../utils/cashSystem");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function parseBet(betArg, userBalance) {
  if (!betArg) return 0;
  betArg = betArg.toLowerCase().trim();
  if (betArg === "all") return userBalance;
  let multiplier = 1;
  if (betArg.endsWith("k")) {
    multiplier = 1000;
    betArg = betArg.slice(0, -1);
  }
  let bet = parseInt(betArg, 10);
  if (isNaN(bet) || bet <= 0) return 0;
  return bet * multiplier;
}

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
const threeMultiplier = {"🍒":3,"🍋":5,"🍉":10,"💎":25,"💰":100,"🥇":1000,"💯":10000,"🎰":8,"🔔":8};
const twoMultiplier = {"🍒":1.2,"🍋":1.5,"🍉":2,"💎":3,"💰":5,"🥇":10,"💯":20,"🎰":1.5,"🔔":1.5};
const houseEdgeFactor = 0.5;

function createEmbed(symbolsArray, bet, userId) {
  const display = `| ${symbolsArray[0]} | ${symbolsArray[1]} | ${symbolsArray[2]} |`;
  return new EmbedBuilder()
    .setTitle("🎰 Slot Machine")
    .setDescription(`Einsatz: ${bet} Credits\n${display}`)
    .setColor("Gold")
    .setTimestamp();
}

async function spinReel(index, currentSymbols, messageObj, bet, userId) {
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    currentSymbols[index] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
    let embed = createEmbed(currentSymbols, bet, userId);
    await messageObj.edit({ embeds: [embed] });
    await sleep(200);
  }
  let finalSymbol = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
  currentSymbols[index] = finalSymbol;
  let embed = createEmbed(currentSymbols, bet, userId);
  await messageObj.edit({ embeds: [embed] });
  return finalSymbol;
}

function evaluateResult(symbolsArray, bet) {
  if (symbolsArray[0] === symbolsArray[1] && symbolsArray[1] === symbolsArray[2]) {
    return Math.round(bet * (threeMultiplier[symbolsArray[0]] || 0) * houseEdgeFactor);
  }
  if (symbolsArray[0] === symbolsArray[1]) {
    return Math.round(bet * (twoMultiplier[symbolsArray[0]] || 0) * houseEdgeFactor);
  }
  if (symbolsArray[1] === symbolsArray[2]) {
    return Math.round(bet * (twoMultiplier[symbolsArray[1]] || 0) * houseEdgeFactor);
  }
  return 0;
}

async function bonusRound(messageObj, bet, userId) {
  let bonusSymbols = [];
  const steps = 3;
  for (let i = 0; i < steps; i++) {
    bonusSymbols.push(weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)]);
    let bonusEmbed = new EmbedBuilder()
      .setTitle("🎉 Bonus Round")
      .setDescription(`Bonus-Symbole: | ${bonusSymbols.join(" | ")} |`)
      .setColor("Blue")
      .setTimestamp();
    await messageObj.edit({ embeds: [bonusEmbed] });
    await sleep(200);
  }
  let multiplier = bonusSymbols.every(s => s === bonusSymbols[0]) ? 15 : 3;
  return bet * multiplier;
}

async function createFinalEmbed(messageObj, currentSymbols, bet, userId, winnings, profit, newBalance, xpGain, currentLevel, leveledUp, bonusWinnings) {
  const display = `| ${currentSymbols[0]} | ${currentSymbols[1]} | ${currentSymbols[2]} |`;
  let desc = `Einsatz: ${bet} Credits\n${display}\n`;
  if (bonusWinnings > 0) desc += `Bonus Gewinn: ${bonusWinnings} Credits\n`;
  desc += winnings > 0 ? `Gewinn: ${winnings} Credits\n` : `Keine Gewinne.\n`;
  desc += `Profit: ${profit} Credits\nNeues Guthaben: ${newBalance} Credits\nXP: +${xpGain} XP\nLevel: ${currentLevel}`;
  if (leveledUp) desc += `\n⭐ Aufstieg! Neues Level: ${currentLevel}`;
  return new EmbedBuilder().setTitle("Slot Machine Ergebnis").setDescription(desc).setColor(winnings > 0 ? "Green" : "Red").setTimestamp();
}

function formatCredits(amount) {
  return amount.toString();
}

function getBonusChance() {
  return 0.05;
}

module.exports = {
  name: "slot",
  description: "Spiele die Slot Machine. Nutze !slot <Betrag> oder !slot all.",
  aliases: ["s"],
  async execute(message, args, client) {
    const userId = message.author.id;
    const { getBalance, removeBalance, addBalance } = require("../utils/cashSystem");
    let balance = await getBalance(userId);
    let betInput = args[0] ? args[0].toLowerCase() : "";
    let bet = parseBet(betInput, balance);
    if (bet <= 0) return message.reply("Ungültiger Einsatz!");
    if (balance < bet) return message.reply("Nicht genug Credits!");
    await removeBalance(userId, bet);
    let currentSymbols = ["❓", "❓", "❓"];
    let embed = createEmbed(currentSymbols, bet, userId);
    let sentMessage = await message.channel.send({ embeds: [embed] });
    for (let i = 0; i < 3; i++) {
      await spinReel(i, currentSymbols, sentMessage, bet, userId);
    }
    let bonusWinnings = 0;
    if (Math.random() < getBonusChance()) {
      bonusWinnings = await bonusRound(sentMessage, bet, userId);
    }
    let winnings = evaluateResult(currentSymbols, bet) + bonusWinnings;
    let profit = winnings - bet;
    await addBalance(userId, winnings);
    const xpGain = Math.floor(bet / 10) + Math.floor(Math.random() * 5);
    let newBalance = await getBalance(userId);
    let finalEmbed = await createFinalEmbed(sentMessage, currentSymbols, bet, userId, winnings, profit, newBalance, xpGain, 1, false, bonusWinnings);
    await sentMessage.edit({ embeds: [finalEmbed] });
    console.log(`Slot result for ${userId}: ${currentSymbols.join(" | ")} | Einsatz: ${bet} | Gewinn: ${winnings} | Profit: ${profit}`);
  },
};
