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
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function updateEmbed(messageObj, reels, bet, userId) {
  let display = `---------------------\n| ${reels[0]} | ${reels[1]} | ${reels[2]} |\n---------------------`;
  let embed = new EmbedBuilder()
    .setTitle(`Slot | User: ${messageObj.author.username} - id: ${userId}`)
    .setDescription(`Einsatz: ${formatNumber(bet)} Credits\n${display}`)
    .setFooter({ text: "Bitte warten..." })
    .setTimestamp();
  await messageObj.edit({ embeds: [embed] });
}

async function spinReel(index, reels, messageObj, bet, userId) {
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    reels[index] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
    await updateEmbed(messageObj, reels, bet, userId);
    await sleep(150);
  }
  reels[index] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
  await updateEmbed(messageObj, reels, bet, userId);
}

function evaluateSlots(reels, bet) {
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    return Math.floor(bet * (threeMultiplier[reels[0]] || 0) * houseEdgeFactor);
  }
  if (reels[0] === reels[1] || reels[1] === reels[2]) {
    return Math.floor(bet * (twoMultiplier[reels[1]] || 0) * houseEdgeFactor);
  }
  return 0;
}

async function createFinalEmbed(messageObj, reels, bet, userId, winnings, profit, newBalance, xpGain, currentLevel, leveledUp) {
  const header = `Slot | User: ${messageObj.author.username} - id: ${userId}`;
  const divider = "---------------------";
  const reelDisplay = `| ${reels[0]} | ${reels[1]} | ${reels[2]} |`;
  let resultText = winnings > 0 ? "--- YOU WIN ---" : "--- YOU LOST ---";
  let desc = `${divider}\n${reelDisplay}\n${divider}\n${resultText}\nProfit: ${formatNumber(profit)} credits\nCredits: You have ${formatNumber(newBalance)} credits\nYou earned ${xpGain} xp`;
  if (leveledUp) desc += `\nLevel Up! New Level: ${currentLevel}`;
  let embed = new EmbedBuilder()
    .setTitle(header)
    .setDescription(desc)
    .setColor(winnings > 0 ? "Green" : "Red")
    .setTimestamp();
  await messageObj.edit({ embeds: [embed] });
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

module.exports = {
  name: "slot",
  description: "Spiele die Slot Machine. Setze deinen Einsatz in Credits. Nutze !s als Kurzform.",
  aliases: ["s"],
  async execute(message, args, client) {
    const userId = message.author.id;
    let betInput = args[0] || "100";
    let currentBalance = await getBalance(userId);
    let bet = parseBet(betInput, currentBalance);
    if (bet <= 0 || bet > currentBalance) return message.reply("Ungültiger Einsatz!");
    await removeBalance(userId, bet);
    let reels = ["❓", "❓", "❓"];
    let embed = new EmbedBuilder().setTitle(`Slot | User: ${message.author.username}`).setDescription(`Einsatz: ${formatNumber(bet)} Credits\n| ❓ | ❓ | ❓ |`).setFooter({ text: "Drehe..." }).setTimestamp();
    let sentMessage = await message.channel.send({ embeds: [embed] });
    for (let i = 0; i < 3; i++) await spinReel(i, reels, sentMessage, bet, userId);
    let winnings = evaluateSlots(reels, bet);
    let profit = winnings - bet;
    await addBalance(userId, winnings);
    let xpGain = Math.floor(bet / 10) + Math.floor(Math.random() * 5);
    let { xp: currentXP, level: currentLevel, leveledUp } = await updateXPAndLevel(userId, xpGain);
    let newBalance = await getBalance(userId);
    await createFinalEmbed(sentMessage, reels, bet, userId, winnings, profit, newBalance, xpGain, currentLevel, leveledUp);
    console.log(`Slot result for ${userId}: ${reels.join(" | ")} | Bet: ${bet} | Win: ${winnings} | Profit: ${profit}`);
  }
};
