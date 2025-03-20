/******************************************************************
 * Professioneller Slot-Command
 * 
 * Funktionalität:
 * - Animiert drei Slot-Reels nacheinander (von links nach rechts).
 * - Berechnet Gewinne für drei gleiche Symbole (3er Match) und
 *   für zwei angrenzende gleiche Symbole (2er Match).
 * - Nutzt einen Hausvorteilsfaktor, sodass langfristig im Schnitt 
 *   ca. 49% des Einsatzes als Gewinn ausgezahlt werden.
 * - Aktualisiert das Guthaben und XP des Spielers (via MongoDB Cash-System).
 * - Zeigt am Ende ein schön gestaltetes Embed mit:
 *    • Endergebnis (Slot-Symbole)
 *    • Gewinn/Verlust (Profit)
 *    • Neues Guthaben
 *    • Gewonnene XP
 * 
 * Hinweis: Dieser Command wird über !slot oder !s aufgerufen.
 ******************************************************************/

const { EmbedBuilder } = require("discord.js");
const { getBalance, removeBalance, addBalance } = require("../utils/cashSystem");

// ===================== Konfiguration Slot-Maschine =====================

// Gewichtete Symbol-Liste: Häufigkeit steuert Gewinnchance
const weightedSymbols = [
  "🍒", "🍒", "🍒", "🍒", "🍒", "🍒", "🍒", "🍒", "🍒", "🍒",  // 10x 🍒
  "🍋", "🍋", "🍋", "🍋", "🍋", "🍋", "🍋", "🍋",                // 8x 🍋
  "🍉", "🍉", "🍉", "🍉", "🍉",                                   // 5x 🍉
  "💎", "💎", "💎",                                             // 3x 💎
  "💰", "💰",                                                  // 2x 💰
  "🥇",                                                        // 1x 🥇
  "💯",                                                        // 1x 💯
  "🎰", "🎰", "🎰",                                             // 3x 🎰
  "🔔", "🔔", "🔔"                                              // 3x 🔔
];
// Gesamthäufigkeit: 10+8+5+3+2+1+1+3+3 = 36

// Multiplikatoren für 3er Match (alle Symbole gleich)
const threeMultiplier = {
  "🍒": 3,
  "🍋": 5,
  "🍉": 10,
  "💎": 25,
  "💰": 100,
  "🥇": 1000,
  "💯": 10000,  // Jackpot, extrem selten
  "🎰": 8,
  "🔔": 8
};

// Multiplikatoren für 2er Match (nur angrenzend)
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

// Hausvorteil (Faktor, mit dem der Gewinn reduziert wird)
const houseEdgeFactor = 0.5;

// ===================== Hilfsfunktionen =====================

// Verzögerungsfunktion (Sleep) – gibt Promise zurück
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Erstellt ein Embed für den Slot-Status (ohne überflüssige Status-Felder)
function createSlotEmbed(symbolsArray, bet, userId, customStatus) {
  const display = `---------------------\n| ${symbolsArray[0]} | ${symbolsArray[1]} | ${symbolsArray[2]} |\n---------------------`;
  const embed = new EmbedBuilder()
    .setTitle("🎰 Slot Machine")
    .setDescription(`Einsatz: **${bet} Credits**\n${display}\n${customStatus}`)
    .setColor("Gold")
    .setTimestamp();
  return embed;
}

// Dreht einen einzelnen Reel mit Animation
async function spinReel(reelIndex, currentSymbols, sentMessage, bet, userId) {
  const steps = 10; // Anzahl der Animation-Updates pro Reel
  for (let i = 0; i < steps; i++) {
    currentSymbols[reelIndex] = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
    const embed = createSlotEmbed(currentSymbols, bet, userId, "Drehe...");
    await sentMessage.edit({ embeds: [embed] });
    await sleep(200); // Kürzere Verzögerung für schnellere Animation (200ms)
  }
  // Letzter Fix: Bestimme finales Symbol
  const finalSymbol = weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
  currentSymbols[reelIndex] = finalSymbol;
  const embed = createSlotEmbed(currentSymbols, bet, userId, "Fertig");
  await sentMessage.edit({ embeds: [embed] });
  return finalSymbol;
}

// Berechnet den Gewinn basierend auf dem Ergebnis der Slots
function evaluateResult(symbolsArray, bet) {
  // Prüfe, ob alle drei Symbole gleich sind
  if (symbolsArray[0] === symbolsArray[1] && symbolsArray[1] === symbolsArray[2]) {
    const symbol = symbolsArray[0];
    const multiplier = threeMultiplier[symbol] || 0;
    return bet * multiplier * houseEdgeFactor;
  }
  // Prüfe, ob die ersten beiden oder die letzten beiden gleich sind
  if (symbolsArray[0] === symbolsArray[1]) {
    const multiplier = twoMultiplier[symbolsArray[0]] || 0;
    return bet * multiplier * houseEdgeFactor;
  }
  if (symbolsArray[1] === symbolsArray[2]) {
    const multiplier = twoMultiplier[symbolsArray[1]] || 0;
    return bet * multiplier * houseEdgeFactor;
  }
  // Kein Gewinn
  return 0;
}

// Erstellt das finale Ergebnis-Embed mit Gewinn, Profit, neuen Guthaben und XP
async function createResultEmbed(sentMessage, currentSymbols, bet, userId, winnings, xpGain, newBalance) {
  const profit = winnings - bet;
  const display = `---------------------\n| ${currentSymbols[0]} | ${currentSymbols[1]} | ${currentSymbols[2]} |\n---------------------`;
  const embed = new EmbedBuilder()
    .setTitle("🎰 Slot Machine Result")
    .setDescription(`Einsatz: **${bet} Credits**\n${display}`)
    .addFields(
      { name: "Ergebnis", value: winnings > 0 ? `Gewinn: **${winnings} Credits**` : "❌ Keine Gewinne", inline: true },
      { name: "Profit", value: `${profit} Credits`, inline: true },
      { name: "XP", value: `+${xpGain}`, inline: true },
      { name: "Neues Guthaben", value: `**${newBalance} Credits**`, inline: false }
    )
    .setColor(winnings > 0 ? "Green" : "Red")
    .setTimestamp();
  return embed;
}

// ===================== Haupt-Command =====================

module.exports = {
  name: "slot",
  description: "Spiele die Slot Machine. Verwendung: !slot <Einsatz>",
  aliases: ["s"],
  
  async execute(message, args, client) {
    const userId = message.author.id;
    const bet = parseInt(args[0]) || 100;
    
    if (bet <= 0 || isNaN(bet)) {
      return message.reply("❌ Ungültiger Einsatz! Bitte einen positiven Betrag eingeben.");
    }
    
    // Cash-System (MongoDB)
    const { getBalance, removeBalance, addBalance } = require("../utils/cashSystem");
    const currentBalance = await getBalance(userId);
    if (currentBalance < bet) {
      return message.reply("❌ Nicht genug Credits!");
    }
    
    // Einsatz abziehen
    await removeBalance(userId, bet);
    
    let currentSymbols = ["❓", "❓", "❓"];
    let embed = createSlotEmbed(currentSymbols, bet, userId, "Los geht's!");
    const sentMessage = await message.channel.send({ embeds: [embed] });
    
    // Animation: Reels nacheinander drehen
    for (let i = 0; i < 3; i++) {
      await spinReel(i, currentSymbols, sentMessage, bet, userId);
    }
    
    // Gewinn berechnen
    const winnings = evaluateResult(currentSymbols, bet);
    const xpGain = Math.floor(bet / 10) + Math.floor(Math.random() * 5);
    
    // Guthaben aktualisieren
    await addBalance(userId, winnings);
    const newBalance = await getBalance(userId);
    
    // Endgültiges Embed erstellen
    const resultEmbed = await createResultEmbed(sentMessage, currentSymbols, bet, userId, winnings, xpGain, newBalance);
    await sentMessage.edit({ embeds: [resultEmbed] });
    
    // Logge das Ergebnis (zur Debugging-/Statistikzwecken)
    console.log(`Slot-Ergebnis für ${userId}: ${currentSymbols.join(" | ")} | Einsatz: ${bet} | Gewinn: ${winnings} | Neues Guthaben: ${newBalance} | XP: ${xpGain}`);
  },
};

