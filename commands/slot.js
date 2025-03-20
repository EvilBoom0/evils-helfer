const { EmbedBuilder } = require("discord.js");

// Slot-Symbole mit Wahrscheinlichkeiten (je mehr Einträge, desto häufiger erscheint das Symbol)
const symbols = ["🍒", "🍒", "🍒", "🍋", "🍋", "🍋", "🍉", "🍉", "💎", "💰", "🥇", "💯", "🎰", "🔔"];
const multipliers = {
  "🍒🍒🍒": 3,   // 3x Gewinn
  "🍋🍋🍋": 5,   // 5x Gewinn
  "🍉🍉🍉": 10,  // 10x Gewinn
  "💎💎💎": 25,  // 25x Gewinn
  "💰💰💰": 100, // 100x Gewinn
  "🥇🥇🥇": 1000,// 1000x Gewinn (sehr selten)
  "💯💯💯": 10000, // Jackpot
};

// Kleinere Gewinne für 2 gleiche Symbole
const smallWins = {
  "🍒🍒": 1.2,   // 20% mehr als Einsatz
  "🍋🍋": 1.5,   // 50% mehr als Einsatz
  "🍉🍉": 2,     // 2x Einsatz
  "💎💎": 3,     // 3x Einsatz
};

// User-Bank (später durch echte DB ersetzen)
let userCredits = {};
let userXP = {};

// Funktion zum Ziehen der Slots mit Animation
async function spinSlots(sentMessage, userId, bet) {
  let slots = ["❓", "❓", "❓"];
  
  // Animationseffekt - Slots drehen sich nacheinander
  for (let i = 0; i < 3; i++) {
    slots[i] = symbols[Math.floor(Math.random() * symbols.length)];
    const embed = new EmbedBuilder()
      .setTitle(`🎰 Slot Machine | ${userId}`)
      .setDescription(`Einsatz: ${bet} Credits\n---------------------\n| ${slots[0]} | ${slots[1]} | ${slots[2]} |\n---------------------`)
      .setColor("Gold");
    await sentMessage.edit({ embeds: [embed] });
    await new Promise(resolve => setTimeout(resolve, 700)); // Kurze Wartezeit für Animation
  }

  return slots;
}

// Funktion zur Gewinnberechnung
function calculateWinnings(slotResult, bet) {
  const resultString = slotResult.join("");

  // Falls 3 gleiche Symbole → Großer Gewinn
  if (multipliers[resultString]) {
    return bet * multipliers[resultString];
  }

  // Falls 2 gleiche Symbole → Kleiner Gewinn
  for (const smallWin in smallWins) {
    if (resultString.includes(smallWin)) {
      return bet * smallWins[smallWin];
    }
  }

  // Kein Gewinn
  return 0;
}

module.exports = {
  name: "slot",
  description: "Spiele die Slot Machine!",
  aliases: ["s"],

  async execute(message, args, client) {
    const userId = message.author.username;

    // Nutzer initialisieren, falls nicht vorhanden
    if (!userCredits[userId]) userCredits[userId] = 1000;
    if (!userXP[userId]) userXP[userId] = 0;

    const bet = parseInt(args[0]) || 100;
    if (bet <= 0 || isNaN(bet)) return message.reply("❌ Ungültiger Einsatz!");
    if (userCredits[userId] < bet) return message.reply("❌ Du hast nicht genug Credits!");

    // Einsatz abziehen
    userCredits[userId] -= bet;

    // Erste Anzeige bevor sich die Slots drehen
    const embed = new EmbedBuilder()
      .setTitle(`🎰 Slot Machine | ${message.author.username}`)
      .setDescription(`Einsatz: ${bet} Credits\n*Die Slots drehen sich...*`)
      .setColor("Gold");

    const sentMessage = await message.channel.send({ embeds: [embed] });

    // Slots drehen sich
    const slotResult = await spinSlots(sentMessage, userId, bet);
    const winnings = calculateWinnings(slotResult, bet);
    const profit = winnings - bet;

    // Guthaben & XP anpassen
    userCredits[userId] += winnings;
    userXP[userId] += Math.floor(bet / 10) + Math.floor(Math.random() * 5);

    // Endgültige Anzeige mit Ergebnis
    embed.setDescription(`**Einsatz:** ${bet} Credits\n---------------------\n| ${slotResult[0]} | ${slotResult[1]} | ${slotResult[2]} |\n---------------------`)
      .addFields(
        { name: "🎲 Ergebnis", value: winnings > 0 ? `💰 **Gewinn:** ${winnings} Credits` : "❌ **YOU LOST**" },
        { name: "💸 Profit", value: `${profit} Credits`, inline: true },
        { name: "🎖 XP", value: `+${Math.floor(bet / 10)}`, inline: true },
        { name: "💳 Guthaben", value: `Du hast nun **${userCredits[userId]} Credits**`, inline: false }
      )
      .setColor(winnings > 0 ? "Green" : "Red");

    await sentMessage.edit({ embeds: [embed] });
  },
};
