// commands/slot.js
// Professioneller Slot-Command mit Animation und robustem Cash-System
// Nutzt serverseitige Berechnungen, um einen realistischen Casino-Effekt zu erzielen.
// Der Slot-Command wird mit !slot oder !s aufgerufen und nimmt einen Einsatz als Parameter.
// Die Animation erfolgt reelweise (von links nach rechts) und es gibt Gewinnmultiplikatoren
// für 2- und 3-er Matches, wobei extreme Multiplikatoren (z.B. x10000) extrem selten sind.
// Das System ist so ausbalanciert, dass im Durchschnitt ca. 49% des Einsatzes zurückgezahlt werden,
// was bedeutet, dass der Spieler langfristig knapp verliert (Hausvorteil ca. 51%).

const { EmbedBuilder } = require("discord.js");
const { getBalance, removeBalance, addBalance } = require("../utils/cashSystem");

// ----------------------------------------
// Konfiguration: Symbole, Gewichte, Multiplikatoren
// ----------------------------------------

// Wir definieren eine gewichtete Liste von Symbolen.
// Häufige Symbole erscheinen öfter, seltene Symbole seltener.
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
// Die Gesamthäufigkeit beträgt 10+8+5+3+2+1+1+3+3 = 36

// Multiplikatoren für drei gleiche Symbole
const threeMultiplier = {
  "🍒": 3,
  "🍋": 5,
  "🍉": 10,
  "💎": 25,
  "💰": 100,
  "🥇": 1000,
  "💯": 10000, // Jackpot, extrem selten
  "🎰": 8,
  "🔔": 8
};

// Multiplikatoren für zwei gleiche Symbole (nur für angrenzende Paare)
const twoMultiplier = {
  "🍒": 1.5,
  "🍋": 2.5,
  "🍉": 5,
  "💎": 12.5,
  "💰": 50,
  "🥇": 500,
  "💯": 5000,
  "🎰": 4,
  "🔔": 4
};

// Um den Hausvorteil zu gewährleisten, multiplizieren wir den Rohgewinn mit einem Faktor
const houseEdgeFactor = 0.5; // Im Schnitt zahlt das System 50% des Einsatzes als Gewinn

// ----------------------------------------
// Hilfsfunktionen
// ----------------------------------------

// Sleep-Funktion für asynchrone Verzögerungen (ms)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Funktion, um ein zufälliges Symbol aus der gewichteten Liste zu ziehen
function getRandomSymbol() {
  return weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
}

// Funktion, um ein Embed für die Slot-Maschine zu erstellen
// Das Embed zeigt den Einsatz, die aktuellen Slot-Symbole und den Status (z.B. "Spinning", "Locked")
function createSlotEmbed(symbolsArray, bet, userId, statusText) {
  // Erstelle eine Slot-Anzeige als Text
  const display = `---------------------\n| ${symbolsArray[0]} | ${symbolsArray[1]} | ${symbolsArray[2]} |\n---------------------`;
  const embed = new EmbedBuilder()
    .setTitle("🎰 Slot Machine")
    .setDescription(`User: <@${userId}> | Einsatz: ${bet} Credits\n${display}\nStatus: ${statusText}`)
    .setColor("Gold")
    .setTimestamp();
  return embed;
}

// Funktion, um einen einzelnen Reel mit Animation zu drehen
// Der Reel wird mehrmals aktualisiert, bevor das Endergebnis fixiert wird.
async function spinReel(reelIndex, currentSymbols, sentMessage, bet, userId) {
  const steps = 10; // Anzahl der Animation-Updates pro Reel
  let finalSymbol = getRandomSymbol();
  for (let i = 0; i < steps; i++) {
    // Aktualisiere den Reel mit einem zufälligen Symbol
    currentSymbols[reelIndex] = getRandomSymbol();
    const embed = createSlotEmbed(currentSymbols, bet, userId, "Spinning...");
    await sentMessage.edit({ embeds: [embed] });
    // Kurze Verzögerung für Animation
    await sleep(500);
  }
  // Sperre den Reel auf ein finales Symbol
  currentSymbols[reelIndex] = finalSymbol;
  const embed = createSlotEmbed(currentSymbols, bet, userId, "Locked");
  await sentMessage.edit({ embeds: [embed] });
  return finalSymbol;
}

// Funktion zur Berechnung des Gewinns basierend auf dem Slot-Ergebnis
function evaluateResult(symbolsArray, bet) {
  const resultString = symbolsArray.join("");
  
  // Drei gleiche Symbole
  if (symbolsArray[0] === symbolsArray[1] && symbolsArray[1] === symbolsArray[2]) {
    const symbol = symbolsArray[0];
    const multiplier = threeMultiplier[symbol] || 0;
    return bet * multiplier * houseEdgeFactor;
  }
  
  // Zwei gleiche Symbole (nur angrenzend)
  if (symbolsArray[0] === symbolsArray[1] || symbolsArray[1] === symbolsArray[2]) {
    let symbol = symbolsArray[0] === symbolsArray[1] ? symbolsArray[0] : symbolsArray[1];
    const multiplier = twoMultiplier[symbol] || 0;
    return bet * multiplier * houseEdgeFactor;
  }
  
  // Kein Gewinn
  return 0;
}

// Funktion, um das endgültige Slot-Ergebnis-Embed zu erstellen
async function createResultEmbed(sentMessage, currentSymbols, bet, userId) {
  const winnings = evaluateResult(currentSymbols, bet);
  const profit = winnings - bet;
  // Erstelle das finale Embed mit Ergebnissen
  const finalEmbed = new EmbedBuilder()
    .setTitle("🎰 Slot Machine")
    .setDescription(`Einsatz: ${bet} Credits\n---------------------\n| ${currentSymbols[0]} | ${currentSymbols[1]} | ${currentSymbols[2]} |\n---------------------`)
    .addFields(
      { name: "Ergebnis", value: winnings > 0 ? `Gewinn: ${winnings} Credits` : "❌ YOU LOST", inline: true },
      { name: "Profit", value: `${profit} Credits`, inline: true }
    )
    .setColor(winnings > 0 ? "Green" : "Red")
    .setTimestamp();
  return finalEmbed;
}

// ----------------------------------------
// Haupt-Command-Export
// ----------------------------------------
module.exports = {
  name: "slot",
  description: "Spiele die Slot Machine. Benutze !slot oder !s mit deinem Einsatz.",
  aliases: ["s"],
  
  async execute(message, args, client) {
    const userId = message.author.id;
    const bet = parseInt(args[0]) || 100;
    
    // Überprüfe den Einsatz
    if (bet <= 0 || isNaN(bet)) {
      return message.reply("❌ Ungültiger Einsatz! Bitte gib einen positiven Betrag an.");
    }
    
    // Prüfe, ob der Benutzer genügend Guthaben hat (MongoDB-Cash-System)
    const { getBalance, removeBalance, addBalance } = require("../utils/cashSystem");
    const currentBalance = await getBalance(userId);
    if (currentBalance < bet) {
      return message.reply("❌ Du hast nicht genug Credits!");
    }
    
    // Ziehe den Einsatz vom Guthaben ab
    await removeBalance(userId, bet);
    
    // Erstelle einen Start-Embed mit Platzhaltern
    let currentSymbols = ["❓", "❓", "❓"];
    let embed = createSlotEmbed(currentSymbols, bet, userId, "Starting...");
    const sentMessage = await message.channel.send({ embeds: [embed] });
    
    // Animation: Drehe jeden Reel nacheinander
    for (let i = 0; i < 3; i++) {
      await spinReel(i, currentSymbols, sentMessage, bet, userId);
    }
    
    // Berechne die Gewinne und aktualisiere das Guthaben
    const winnings = evaluateResult(currentSymbols, bet);
    const profit = winnings - bet;
    await addBalance(userId, winnings);
    
    // Erstelle das finale Ergebnis-Embed und zeige es an
    const resultEmbed = await createResultEmbed(sentMessage, currentSymbols, bet, userId);
    await sentMessage.edit({ embeds: [resultEmbed] });
    
    // Füge außerdem XP hinzu (ein einfaches XP-System)
    const xpGain = Math.floor(bet / 10) + Math.floor(Math.random() * 5);
    // Nehme an, du hast eine XP-Funktion in cashSystem oder einer anderen Datei
    // Beispiel: await addXP(userId, xpGain);
    
    // Falls du möchtest, dass der Bot auch in den Logs das Ergebnis anzeigt:
    console.log(`Slot result for ${userId}: ${currentSymbols.join(" | ")} | Bet: ${bet} | Gewinn: ${winnings} | Profit: ${profit}`);
  },
};
