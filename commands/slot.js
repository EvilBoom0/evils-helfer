const { EmbedBuilder } = require("discord.js");
const { getBalance, removeBalance, addBalance } = require("../utils/cashSystem");
const { getXP, addXP } = require("../utils/xpSystem");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatNumber(num) {
  if (num >= 1000000) return Math.round(num / 1000000) + "m";
  if (num >= 1000) return Math.round(num / 1000) + "k";
  return Math.round(num).toString();
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

async function animateReel(index, currentSymbols, messageObj, bet, userId) {
  const steps = 3;
  for (let i = 0; i < steps; i++) {
    currentSymbols[index] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
    let embed = buildEmbed(currentSymbols, bet, userId, false);
    await messageObj.edit({ embeds: [embed] });
    await sleep(200);
  }
  currentSymbols[index] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
  let embed = buildEmbed(currentSymbols, bet, userId, false);
  await messageObj.edit({ embeds: [embed] });
}

function buildEmbed(symbols, bet, userId, final) {
  let header = `Slot | User: <@${userId}> - id: ${userId}`;
  let divider = "---------------------";
  let slotLine = `| ${symbols[0]} | ${symbols[1]} | ${symbols[2]} |`;
  let resultText = final ? generateResultText(symbols, bet) : "";
  let description = `${header}\n${divider}\n${slotLine}\n${divider}\n${resultText}`;
  return new EmbedBuilder().setTitle("Slot Machine").setDescription(description).setColor(final ? (resultText.includes("YOU LOST") ? "Red" : "Green") : "Gold").setTimestamp();
}

function generateResultText(symbols, bet) {
  let winAmount = calculateWinnings(symbols, bet);
  let outcome = (symbols[0] === symbols[1] && symbols[1] === symbols[2])
    ? "YOU WON BIG!"
    : (symbols[0] === symbols[1] || symbols[1] === symbols[2])
      ? "YOU WON!"
      : "YOU LOST";
  let profit = winAmount - bet;
  let text = `${outcome}\nProfit\n${profit < 0 ? profit : "+" + profit} credits\nCredits\nYou have ${formatNumber(winAmount)} credits\nYou earned ${Math.floor(bet / 10) + Math.floor(Math.random() * 5)} xp`;
  return text;
}

function calculateWinnings(symbols, bet) {
  if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
    let mult = threeMultiplier[symbols[0]] || 0;
    return Math.round(bet * mult * houseEdgeFactor);
  }
  if (symbols[0] === symbols[1]) {
    let mult = twoMultiplier[symbols[0]] || 0;
    return Math.round(bet * mult * houseEdgeFactor);
  }
  if (symbols[1] === symbols[2]) {
    let mult = twoMultiplier[symbols[1]] || 0;
    return Math.round(bet * mult * houseEdgeFactor);
  }
  return 0;
}

function calculateXPThreshold(level) {
  return level * 100;
}

function updateXP(currentXP, currentLevel, xpGain) {
  let leveledUp = false;
  currentXP += xpGain;
  let threshold = calculateXPThreshold(currentLevel);
  while (currentXP >= threshold) {
    currentXP -= threshold;
    currentLevel++;
    leveledUp = true;
    threshold = calculateXPThreshold(currentLevel);
  }
  return { currentXP, currentLevel, leveledUp };
}

async function recordGameLog(userId, bet, winAmount, profit, xpGain) {
  const fs = require("fs");
  const path = require("path");
  let logEntry = `[${new Date().toISOString()}] ${userId} - Bet: ${bet}, Win: ${winAmount}, Profit: ${profit}, XP: ${xpGain}\n`;
  fs.appendFileSync(path.join(__dirname, "../data/gameLog.txt"), logEntry, "utf8");
}

async function updateUserStats(userId, bet, winAmount, profit, xpGain, currentXP, currentLevel, leveledUp) {
  const fs = require("fs");
  const path = require("path");
  let statsEntry = {
    timestamp: new Date().toISOString(),
    userId,
    bet,
    winAmount,
    profit,
    xpGain,
    currentXP,
    currentLevel,
    leveledUp
  };
  fs.appendFileSync(path.join(__dirname, "../data/gameStats.json"), JSON.stringify(statsEntry) + "\n", "utf8");
}

async function logAnalytics() {
  const fs = require("fs");
  const path = require("path");
  const statsPath = path.join(__dirname, "../data/gameStats.json");
  if (!fs.existsSync(statsPath)) return;
  let stats = fs.readFileSync(statsPath, "utf8").split("\n").filter(Boolean);
  let totalGames = stats.length;
  let totalProfit = stats.reduce((acc, line) => {
    try { let data = JSON.parse(line); return acc + data.profit; } catch(e) { return acc; }
  }, 0);
  console.log(`Analytics: Total Games: ${totalGames}, Average Profit: ${ (totalGames > 0 ? (totalProfit/totalGames).toFixed(2) : 0) } credits`);
}

module.exports = {
  name: "slot",
  description: "Spiele Slots. Nutze !slot oder !s <Betrag/all>",
  aliases: ["s"],
  async execute(message, args, client) {
    const userId = message.author.id;
    let bet = (args[0] && args[0].toLowerCase() === "all") ? await getBalance(userId) : parseInt(args[0]) || 100;
    if (bet <= 0 || isNaN(bet)) return message.reply("Ungültiger Einsatz!");
    const currentBal = await getBalance(userId);
    if (currentBal < bet) return message.reply("Nicht genug Credits!");
    await removeBalance(userId, bet);
    let currentSymbols = ["❓","❓","❓"];
    let sentMessage = await message.channel.send({ embeds: [buildEmbed(currentSymbols, bet, userId, false)] });
    await animateReel(0, currentSymbols, sentMessage, bet, userId);
    await animateReel(1, currentSymbols, sentMessage, bet, userId);
    await animateReel(2, currentSymbols, sentMessage, bet, userId);
    let winAmount = calculateWinnings(currentSymbols, bet);
    let profit = winAmount - bet;
    let bonus = 0;
    if (Math.random() < 0.00001) bonus = bet * 10000;
    winAmount += bonus;
    profit = winAmount - bet;
    await addBalance(userId, winAmount);
    let xpGain = Math.floor(bet / 10) + Math.floor(Math.random() * 5);
    let xpData = await getXP(userId).catch(() => ({ xp: 0, level: 1 }));
    let currentXP = xpData.xp, currentLevel = xpData.level;
    let xpResult = updateXP(currentXP, currentLevel, xpGain);
    currentXP = xpResult.currentXP;
    currentLevel = xpResult.currentLevel;
    let leveledUp = xpResult.leveledUp;
    await addXP(userId, xpGain);
    await createFinalEmbed(sentMessage, currentSymbols, bet, userId, winAmount, profit, await getBalance(userId), xpGain, currentLevel, leveledUp);
    await recordGameLog(userId, bet, winAmount, profit, xpGain);
    await updateUserStats(userId, bet, winAmount, profit, xpGain, currentXP, currentLevel, leveledUp);
    await logAnalytics();
    console.log(`Slot result for ${userId}: ${currentSymbols.join(" | ")} | Bet: ${bet} | Win: ${winAmount} | Profit: ${profit}`);
  }
};
