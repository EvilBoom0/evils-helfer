const { EmbedBuilder } = require("discord.js");
const { getBalance, removeBalance, addBalance } = require("../utils/cashSystem");
const { getXP, addXP } = require("../utils/xpSystem");

function parseBet(input, currentBalance) {
  input = input.toLowerCase().trim();
  if (input === "all") return currentBalance;
  let multiplier = 1;
  if (input.endsWith("k")) {
    multiplier = 1000;
    input = input.slice(0, -1);
  } else if (input.endsWith("m")) {
    multiplier = 1000000;
    input = input.slice(0, -1);
  }
  let amount = parseInt(input);
  return isNaN(amount) ? 0 : amount * multiplier;
}

function formatNumber(num) {
  if (num >= 1000000) return Math.floor(num / 1000000) + "m";
  if (num >= 1000) return Math.floor(num / 1000) + "k";
  return Math.floor(num).toString();
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
  "🍒": 1.5,
  "🍋": 2,
  "🍉": 3,
  "💎": 4,
  "💰": 6,
  "🥇": 15,
  "💯": 50,
  "🎰": 1.5,
  "🔔": 1.5
};

const houseEdgeFactor = 0.49;
const bonusChance = 0.02;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function createEmbed(symbols, bet, userId) {
  const display = `---------------------\n| ${symbols[0]} | ${symbols[1]} | ${symbols[2]} |\n---------------------`;
  return new EmbedBuilder()
    .setTitle(`Slot | User: ${message.author.username} - id: ${userId}`)
    .setDescription(`Einsatz: ${formatNumber(bet)} Credits\n${display}`)
    .setColor("Gold")
    .setTimestamp();
}

async function spinReel(index, reels, sentMessage, bet, userId) {
  const steps = 3;
  for (let i = 0; i < steps; i++) {
    reels[index] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
    let embed = new EmbedBuilder()
      .setTitle(`Slot | User: ${message.author.username} - id: ${userId}`)
      .setDescription(`Einsatz: ${formatNumber(bet)} Credits\n---------------------\n| ${reels[0]} | ${reels[1]} | ${reels[2]} |\n---------------------`)
      .setFooter({ text: "Drehe..." })
      .setTimestamp();
    await sentMessage.edit({ embeds: [embed] });
    await sleep(100);
  }
  reels[index] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
  let embed = new EmbedBuilder()
    .setTitle(`Slot | User: ${message.author.username} - id: ${userId}`)
    .setDescription(`Einsatz: ${formatNumber(bet)} Credits\n---------------------\n| ${reels[0]} | ${reels[1]} | ${reels[2]} |\n---------------------`)
    .setFooter({ text: "Gestoppt" })
    .setTimestamp();
  await sentMessage.edit({ embeds: [embed] });
}

function evaluateSlots(reels, bet) {
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    return Math.floor(bet * (threeMultiplier[reels[0]] || 0) * houseEdgeFactor);
  }
  if (reels[0] === reels[1]) {
    return Math.floor(bet * (twoMultiplier[reels[0]] || 0) * houseEdgeFactor);
  }
  if (reels[1] === reels[2]) {
    return Math.floor(bet * (twoMultiplier[reels[1]] || 0) * houseEdgeFactor);
  }
  return 0;
}

function getBonusWinnings(bet) {
  if (Math.random() < bonusChance) {
    return Math.floor(bet * (Math.random() * (10000 - 1000) + 1000));
  }
  return 0;
}

async function createFinalEmbed(sentMessage, reels, bet, userId, winnings, profit, newBalance, xpGain, currentLevel, leveledUp) {
  const header = `Slot | User: ${message.author.username} - id: ${userId}`;
  const divider = "---------------------";
  const reelDisplay = `| ${reels[0]} | ${reels[1]} | ${reels[2]} |`;
  let resultText = winnings > 0 ? "--- YOU WIN ---" : "--- YOU LOST ---";
  let desc = `${divider}\n${reelDisplay}\n${divider}\n${resultText}\nProfit: ${profit} credits\nCredits: You have ${formatNumber(newBalance)} credits\nYou earned ${xpGain} xp`;
  if (leveledUp) desc += `\nLevel Up! New Level: ${currentLevel}`;
  let embed = new EmbedBuilder()
    .setTitle(header)
    .setDescription(desc)
    .setColor(winnings > 0 ? "Green" : "Red")
    .setTimestamp();
  await sentMessage.edit({ embeds: [embed] });
}

async function updateXPAndLevel(userId, xpGain) {
  let xpData = await getXP(userId).catch(() => ({ xp: 0, level: 1 }));
  let currentXP = xpData.xp;
  let currentLevel = xpData.level;
  currentXP += xpGain;
  let leveledUp = false;
  let threshold = currentLevel * 100;
  while (currentXP >= threshold) {
    currentXP -= threshold;
    currentLevel++;
    leveledUp = true;
    threshold = currentLevel * 100;
  }
  await addXP(userId, xpGain);
  return { xp: currentXP, level: currentLevel, leveledUp };
}

async function logGameResult(userId, bet, winnings, profit) {
  const fs = require("fs");
  const path = require("path");
  const logPath = path.join(__dirname, "../data/slotLog.txt");
  const entry = `[${new Date().toISOString()}] User: ${userId} | Bet: ${bet} | Win: ${winnings} | Profit: ${profit}\n`;
  fs.appendFileSync(logPath, entry, "utf8");
}

async function updateGameStats(userId, bet, winnings, profit, xpGain, currentXP, currentLevel, leveledUp) {
  const fs = require("fs");
  const path = require("path");
  const statsPath = path.join(__dirname, "../data/statistics.json");
  let stats = {};
  if (fs.existsSync(statsPath)) {
    try { stats = JSON.parse(fs.readFileSync(statsPath, "utf8")); } catch(e){ stats = {}; }
  }
  if (!stats[userId]) stats[userId] = { games: 0, totalBet: 0, totalWin: 0, totalProfit: 0, xpEarned: 0 };
  stats[userId].games += 1;
  stats[userId].totalBet += bet;
  stats[userId].totalWin += winnings;
  stats[userId].totalProfit += profit;
  stats[userId].xpEarned += xpGain;
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), "utf8");
}

function logAnalytics() {
  const fs = require("fs");
  const path = require("path");
  const statsPath = path.join(__dirname, "../data/statistics.json");
  if (!fs.existsSync(statsPath)) return;
  let stats = JSON.parse(fs.readFileSync(statsPath, "utf8"));
  let totalProfit = 0, totalGames = 0;
  for (const uid in stats) {
    totalProfit += stats[uid].totalProfit;
    totalGames += stats[uid].games;
  }
  console.log(`Durchschnittlicher Profit pro Spiel: ${totalGames === 0 ? 0 : (totalProfit / totalGames).toFixed(2)} credits`);
}

async function updateXPAndStats(userId, bet, winnings, xpGain) {
  let xpData = await getXP(userId).catch(() => ({ xp: 0, level: 1 }));
  let currentXP = xpData.xp;
  let currentLevel = xpData.level;
  currentXP += xpGain;
  let leveledUp = false;
  let threshold = currentLevel * 100;
  while (currentXP >= threshold) {
    currentXP -= threshold;
    currentLevel++;
    leveledUp = true;
    threshold = currentLevel * 100;
  }
  await addXP(userId, xpGain);
  return { currentXP, currentLevel, leveledUp };
}

module.exports = {
  name: "slot",
  description: "Spiele die Slot Machine. Setze deinen Einsatz in Credits mit !slot oder !s.",
  aliases: ["s"],
  async execute(message, args, client) {
    const userId = message.author.id;
    let betInput = args[0] || "100";
    const { getBalance, removeBalance, addBalance } = require("../utils/cashSystem");
    let currentBalance = await getBalance(userId);
    let bet = parseBet(betInput, currentBalance);
    if (bet <= 0) return message.reply("Ungültiger Einsatz!");
    if (bet > currentBalance) return message.reply("Nicht genug Credits!");
    await removeBalance(userId, bet);
    let reels = ["❓", "❓", "❓"];
    let embed = createEmbed(reels, bet, userId);
    let sentMessage = await message.channel.send({ embeds: [embed] });
    for (let i = 0; i < 3; i++) {
      await spinReel(i, reels, sentMessage, bet, userId);
    }
    let bonusWinnings = getBonusWinnings(bet);
    let winnings = evaluateSlots(reels, bet) + bonusWinnings;
    let profit = winnings - bet;
    await addBalance(userId, winnings);
    let xpGain = Math.floor(bet / 10) + Math.floor(Math.random() * 5);
    let { currentXP, currentLevel, leveledUp } = await updateXPAndStats(userId, bet, winnings, xpGain);
    let newBalance = await getBalance(userId);
    await createFinalEmbed(sentMessage, reels, bet, userId, winnings, profit, newBalance, xpGain, currentLevel, leveledUp);
    await logGameResult(userId, bet, winnings, profit);
    await updateGameStats(userId, bet, winnings, profit, xpGain, currentXP, currentLevel, leveledUp);
    logAnalytics();
    console.log(`Slot result for ${userId}: ${reels.join(" | ")} | Bet: ${bet} | Win: ${winnings} | Profit: ${profit}`);
  }
};
