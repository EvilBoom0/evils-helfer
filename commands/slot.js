const { EmbedBuilder } = require("discord.js");
const { getBalance, removeBalance, addBalance } = require("../utils/cashSystem");
const { getXP, addXP } = require("../utils/xpSystem");
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function createEmbed(symbols, bet, userId) {
  const display = `| ${symbols[0]} | ${symbols[1]} | ${symbols[2]} |`;
  return new EmbedBuilder().setTitle("🎰 Slot Machine").setDescription(`Einsatz: ${bet} Credits\n${display}`).setColor("Gold").setTimestamp();
}
async function spinReel(index, currentSymbols, messageObj, bet, userId) {
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    currentSymbols[index] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
    let embed = createEmbed(currentSymbols, bet, userId);
    await messageObj.edit({ embeds: [embed] });
    await sleep(300);
  }
  let finalSymbol = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
  currentSymbols[index] = finalSymbol;
  let embed = createEmbed(currentSymbols, bet, userId);
  await messageObj.edit({ embeds: [embed] });
  return finalSymbol;
}
function evaluateSlots(symbols, bet) {
  if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
    let m = threeMultiplier[symbols[0]] || 0;
    return bet * m * houseEdgeFactor;
  }
  if (symbols[0] === symbols[1]) {
    let m = twoMultiplier[symbols[0]] || 0;
    return bet * m * houseEdgeFactor;
  }
  if (symbols[1] === symbols[2]) {
    let m = twoMultiplier[symbols[1]] || 0;
    return bet * m * houseEdgeFactor;
  }
  return 0;
}
async function createFinalEmbed(messageObj, symbols, bet, userId, winnings, profit, newBalance, xpGain, currentLevel, leveledUp, bonusWinnings) {
  const display = `| ${symbols[0]} | ${symbols[1]} | ${symbols[2]} |`;
  let desc = `Einsatz: ${bet} Credits\n${display}\n`;
  if (bonusWinnings > 0) desc += `Bonus Gewinn: ${bonusWinnings} Credits\n`;
  desc += winnings > 0 ? `Gewinn: ${winnings} Credits\n` : `Keine Gewinne.\n`;
  desc += `Profit: ${profit} Credits\n`;
  desc += `Neues Guthaben: ${newBalance} Credits\n`;
  desc += `XP: +${xpGain} (Level: ${currentLevel})\n`;
  if (leveledUp) desc += `⭐ Aufstieg! Neues Level: ${currentLevel}\n`;
  let embed = new EmbedBuilder().setTitle("Slot Machine Ergebnis").setDescription(desc).setColor(winnings > 0 ? "Green" : "Red").setTimestamp();
  await messageObj.edit({ embeds: [embed] });
  return { embed, winnings, profit };
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
function formatCredits(amount) { return amount.toLocaleString("de-DE"); }
function calculateXPThreshold(level) { return level * 100; }
function getBonusChance() { return 0.10; }
async function bonusRound(messageObj, bet, userId) {
  let bonusSymbols = [];
  for (let i = 0; i < 7; i++) {
    bonusSymbols.push(weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)]);
    let bonusEmbed = new EmbedBuilder().setTitle("🎉 Bonus Round").setDescription(`Bonus-Symbole: | ${bonusSymbols.join(" | ")} |`).setColor("Blue").setTimestamp();
    await messageObj.edit({ embeds: [bonusEmbed] });
    await sleep(400);
  }
  let multiplier = bonusSymbols.every(s => s === bonusSymbols[0]) ? 15 : 3;
  return bet * multiplier;
}
async function updateGameStats(userId, bet, winnings, profit, xpGain, currentXP, currentLevel, leveledUp) {
  const fs = require("fs");
  const path = require("path");
  const dataPath = path.join(__dirname, "../data/gameStats.json");
  let stats = { timestamp: new Date().toISOString(), userId, bet, winnings, profit, xpGain, currentXP, currentLevel, leveledUp };
  fs.appendFileSync(dataPath, JSON.stringify(stats) + "\n", "utf8");
}
function logGameResult(userId, resultString) {
  const fs = require("fs");
  const path = require("path");
  const logPath = path.join(__dirname, "../data/gameLog.txt");
  let entry = `[${new Date().toISOString()}] User: ${userId} - ${resultString}\n`;
  fs.appendFileSync(logPath, entry, "utf8");
}
async function calculateStatistics(userId, bet, winnings, profit, xpGain, currentXP, currentLevel, leveledUp) {
  const fs = require("fs");
  const path = require("path");
  const statsPath = path.join(__dirname, "../data/statistics.json");
  let stats = {};
  if (fs.existsSync(statsPath)) { try { stats = JSON.parse(fs.readFileSync(statsPath, "utf8")); } catch(e){ stats = {}; } }
  if (!stats[userId]) { stats[userId] = { games: 0, totalBet: 0, totalWinnings: 0, totalProfit: 0, xpEarned: 0 }; }
  stats[userId].games += 1;
  stats[userId].totalBet += bet;
  stats[userId].totalWinnings += winnings;
  stats[userId].totalProfit += profit;
  stats[userId].xpEarned += xpGain;
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), "utf8");
}
function calculateAverageProfit(stats) {
  let totalProfit = 0;
  let totalGames = 0;
  for (const user in stats) {
    totalProfit += stats[user].totalProfit;
    totalGames += stats[user].games;
  }
  return totalGames === 0 ? 0 : totalProfit / totalGames;
}
function formatXPInfo(currentXP, currentLevel) {
  return `XP: ${currentXP} | Level: ${currentLevel}`;
}
async function logAnalytics() {
  const fs = require("fs");
  const path = require("path");
  const statsPath = path.join(__dirname, "../data/statistics.json");
  if (!fs.existsSync(statsPath)) return;
  let stats = JSON.parse(fs.readFileSync(statsPath, "utf8"));
  const avgProfit = calculateAverageProfit(stats);
  console.log(`Durchschnittlicher Profit pro Spiel: ${avgProfit.toFixed(2)} Credits`);
}
module.exports = {
  name: "slot",
  description: "Spiele Slots.",
  aliases: ["s"],
  async execute(message, args, client) {
    const userId = message.author.id;
    const bet = parseInt(args[0]) || 100;
    if (bet <= 0 || isNaN(bet)) return message.reply("Ungültiger Einsatz!");
    const currentBalance = await getBalance(userId);
    if (currentBalance < bet) return message.reply("Nicht genug Credits!");
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
    let winnings = evaluateSlots(currentSymbols, bet) + bonusWinnings;
    let profit = winnings - bet;
    await addBalance(userId, winnings);
    const xpGain = Math.floor(bet / 10) + Math.floor(Math.random() * 5);
    let currentXP = 0;
    let currentLevel = 1;
    try {
      const xpData = await getXP(userId);
      currentXP = xpData.xp;
      currentLevel = xpData.level;
    } catch (e) {
      currentXP = 0;
      currentLevel = 1;
    }
    currentXP += xpGain;
    let leveledUp = false;
    let xpThreshold = calculateXPThreshold(currentLevel);
    while (currentXP >= xpThreshold) {
      currentXP -= xpThreshold;
      currentLevel++;
      leveledUp = true;
      xpThreshold = calculateXPThreshold(currentLevel);
    }
    await addXP(userId, xpGain);
    const newBalance = await getBalance(userId);
    await createFinalEmbed(sentMessage, currentSymbols, bet, userId, winnings, profit, newBalance, xpGain, currentLevel, leveledUp, bonusWinnings);
    logGameResult(userId, `${currentSymbols.join(" | ")} | Einsatz: ${bet} | Gewinn: ${winnings} | Profit: ${profit}`);
    await updateGameStats(userId, bet, winnings, profit, xpGain, currentXP, currentLevel, leveledUp);
    await calculateStatistics(userId, bet, winnings, profit, xpGain, currentXP, currentLevel, leveledUp);
    await logAnalytics();
    console.log(`Slot result for ${userId}: ${currentSymbols.join(" | ")} | Bet: ${bet} | Gewinn: ${winnings} | Profit: ${profit}`);
  }
};
