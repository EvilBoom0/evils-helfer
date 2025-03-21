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
  "🍒", "🍒", "🍒", "🍒", "🍒", "🍒", "🍒", "🍒", "🍒", "🍒",
  "🍋", "🍋", "🍋", "🍋", "🍋", "🍋", "🍋", "🍋",
  "🍉", "🍉", "🍉", "🍉", "🍉",
  "💎", "💎", "💎",
  "💰", "💰",
  "🥇", "💯",
  "🎰", "🎰", "🎰",
  "🔔", "🔔", "🔔"
];

const threeMultiplier = {
  "🍒": 3, "🍋": 5, "🍉": 10, "💎": 25, "💰": 100, "🥇": 1000, "💯": 10000, "🎰": 8, "🔔": 8
};

const twoMultiplier = {
  "🍒": 1.5, "🍋": 2, "🍉": 3, "💎": 4, "💰": 6, "🥇": 15, "💯": 50, "🎰": 1.5, "🔔": 1.5
};

const houseEdgeFactor = 0.49;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function spinReel(index, reels, messageObj, bet, userId) {
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    reels[index] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
    let embed = createEmbed(reels, bet, userId, "Drehe...");
    await messageObj.edit({ embeds: [embed] });
    await sleep(150);
  }
  reels[index] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
  let embed = createEmbed(reels, bet, userId, "Gestoppt");
  await messageObj.edit({ embeds: [embed] });
}

function createEmbed(reels, bet, userId, status) {
  return new EmbedBuilder()
    .setTitle(`Slot | User: ${userId}`)
    .setDescription(`Einsatz: ${formatNumber(bet)} Credits\n---------------------\n| ${reels[0]} | ${reels[1]} | ${reels[2]} |\n---------------------`)
    .setFooter({ text: status })
    .setTimestamp();
}

function evaluateSlots(reels, bet) {
  if (reels[0] === reels[1] && reels[1] === reels[2]) return Math.floor(bet * (threeMultiplier[reels[0]] || 0) * houseEdgeFactor);
  if (reels[0] === reels[1]) return Math.floor(bet * (twoMultiplier[reels[0]] || 0) * houseEdgeFactor);
  if (reels[1] === reels[2]) return Math.floor(bet * (twoMultiplier[reels[1]] || 0) * houseEdgeFactor);
  return 0;
}

async function finalizeGame(messageObj, reels, bet, userId, winnings, profit, newBalance, xpGain, level, leveledUp) {
  let embed = new EmbedBuilder()
    .setTitle(`Slot | User: ${userId}`)
    .setDescription(`Einsatz: ${formatNumber(bet)} Credits\n---------------------\n| ${reels[0]} | ${reels[1]} | ${reels[2]} |\n---------------------\n${winnings > 0 ? "**YOU WIN!**" : "**YOU LOST!**"}\nProfit: ${formatNumber(profit)} credits\nCredits: You have ${formatNumber(newBalance)} credits\nXP: +${xpGain} (Level: ${level})`)
    .setColor(winnings > 0 ? "Green" : "Red")
    .setTimestamp();
  if (leveledUp) embed.setDescription(embed.data.description + `\n⭐ **Level Up!** New Level: ${level}`);
  await messageObj.edit({ embeds: [embed] });
}

async function updateXPAndLevel(userId, xpGain) {
  let { xp, level } = await getXP(userId).catch(() => ({ xp: 0, level: 1 }));
  xp += xpGain;
  let leveledUp = false;
  let threshold = level * 100;
  while (xp >= threshold) {
    xp -= threshold;
    level++;
    leveledUp = true;
    threshold = level * 100;
  }
  await addXP(userId, xpGain);
  return { xp, level, leveledUp };
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
    if (bet <= 0 || bet > currentBalance) return message.reply("Ungültiger Einsatz oder zu wenig Credits!");
    await removeBalance(userId, bet);
    let reels = ["❓", "❓", "❓"];
    let sentMessage = await message.channel.send({ embeds: [createEmbed(reels, bet, userId, "Startet...")] });
    for (let i = 0; i < 3; i++) await spinReel(i, reels, sentMessage, bet, userId);
    let winnings = evaluateSlots(reels, bet);
    let profit = winnings - bet;
    await addBalance(userId, winnings);
    let xpGain = Math.floor(bet / 10) + Math.floor(Math.random() * 5);
    let { xp, level, leveledUp } = await updateXPAndLevel(userId, xpGain);
    let newBalance = await getBalance(userId);
    await finalizeGame(sentMessage, reels, bet, userId, winnings, profit, newBalance, xpGain, level, leveledUp);
  }
};
