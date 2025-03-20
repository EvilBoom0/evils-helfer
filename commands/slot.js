const { EmbedBuilder } = require("discord.js");
const { getBalance, addBalance, removeBalance } = require("../utils/cashSystem");

// Verzögerungsfunktion für Animation
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Verfügbare Slot-Symbole – häufigere Symbole erscheinen öfter
const symbols = [
  "🍒", "🍒", "🍒", "🍒", "🍒", // hohe Wahrscheinlichkeit
  "🍋", "🍋", "🍋", "🍋",        // mittelhohe Wahrscheinlichkeit
  "🍉", "🍉",                   // seltener
  "💎",                         // selten
  "💰",                         // sehr selten
  "🥇",                         // extrem selten
  "💯",                         // Jackpot, extrem selten
  "🎰", "🔔"                    // Ergänzende Symbole
];

// Multiplikatoren bei drei gleichen Symbolen
const multipliers = {
  "🍒🍒🍒": 3,
  "🍋🍋🍋": 5,
  "🍉🍉🍉": 10,
  "💎💎💎": 25,
  "💰💰💰": 100,
  "🥇🥇🥇": 1000,
  "💯💯💯": 10000
};

// Kleine Gewinne, wenn zwei gleiche Symbole auftauchen
const smallWins = {
  "🍒🍒": 1.2,
  "🍋🍋": 1.5,
  "🍉🍉": 2,
  "💎💎": 3
};

// Hilfsfunktion: Wählt zufällig ein Symbol aus dem Array
function getRandomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

// Funktion, die einen einzelnen Slot animiert
async function animateSlot(sentMessage, embed, slotIndex, iterations) {
  let currentSymbol = "❓";
  // Wiederhole für die angegebene Anzahl an Iterationen
  for (let i = 0; i < iterations; i++) {
    currentSymbol = getRandomSymbol();
    // Aktualisiere das entsprechende Slot-Feld
    // Wir arbeiten mit einem Array, das alle 3 Slot-Werte enthält
    embed.data.description = embed.data.description.split("\n")[0] + "\n" +
      `| ${embed.data.fields ? embed.data.fields[0].value : "❓"} | ${embed.data.fields ? embed.data.fields[1].value : "❓"} | ${embed.data.fields ? embed.data.fields[2].value : "❓"} |`;
    // Ersetze den jeweiligen Slot je nach Index
    // Wir erstellen hier ein Array der Slot-Werte, die initial als "❓" gesetzt werden
    let slotDisplay = ["❓", "❓", "❓"];
    if (embed.data.fields && embed.data.fields[0]) {
      slotDisplay = [
        embed.data.fields[0].value,
        embed.data.fields[1].value,
        embed.data.fields[2].value
      ];
    }
    slotDisplay[slotIndex] = currentSymbol;

    // Erstelle einen neuen Beschreibungstext
    const descriptionText = `Einsatz: ${embed.data.title.split(" | ")[1]}\n---------------------\n| ${slotDisplay[0]} | ${slotDisplay[1]} | ${slotDisplay[2]} |\n---------------------\n*Die Slots drehen sich...*`;
    embed.setDescription(descriptionText);

    // Aktualisiere Embed im Channel
    await sentMessage.edit({ embeds: [embed] });
    await delay(500); // Warte 500ms
  }
  return currentSymbol;
}

// Hauptfunktion: Animiert die Slots nacheinander (links, dann Mitte, dann rechts)
async function animateSlots(sentMessage, embed, bet) {
  // Initialisiere Slots als Array mit Platzhaltern
  let slots = ["❓", "❓", "❓"];
  
  // Setze initiales Embed, falls nicht schon gesetzt
  embed.setDescription(`Einsatz: ${bet} Credits\n---------------------\n| ${slots[0]} | ${slots[1]} | ${slots[2]} |\n---------------------\n*Die Slots drehen sich...*`);
  await sentMessage.edit({ embeds: [embed] });
  
  // Animationsdauer (Anzahl Iterationen) für jeden Slot
  const iterations = [5, 7, 9]; // links, mitte, rechts

  // Animieren der linken Slot
  const leftSymbol = await animateSlot(sentMessage, embed, 0, iterations[0]);
  slots[0] = leftSymbol;
  
  // Setze aktualisiertes Embed nach linkem Stopp
  embed.setDescription(`Einsatz: ${bet} Credits\n---------------------\n| ${slots[0]} | ${slots[1]} | ${slots[2]} |\n---------------------\n*Linker Slot gestoppt...*`);
  await sentMessage.edit({ embeds: [embed] });
  
  // Animieren der mittleren Slot
  const midSymbol = await animateSlot(sentMessage, embed, 1, iterations[1]);
  slots[1] = midSymbol;
  
  embed.setDescription(`Einsatz: ${bet} Credits\n---------------------\n| ${slots[0]} | ${slots[1]} | ${slots[2]} |\n---------------------\n*Mittlerer Slot gestoppt...*`);
  await sentMessage.edit({ embeds: [embed] });
  
  // Animieren der rechten Slot
  const rightSymbol = await animateSlot(sentMessage, embed, 2, iterations[2]);
  slots[2] = rightSymbol;
  
  embed.setDescription(`Einsatz: ${bet} Credits\n---------------------\n| ${slots[0]} | ${slots[1]} | ${slots[2]} |\n---------------------`);
  await sentMessage.edit({ embeds: [embed] });
  
  return slots;
}

// Berechnung der Gewinne
function calculateWinnings(slotResult, bet) {
  const resultString = slotResult.join("");
  // Prüfe zuerst auf 3 gleiche Symbole
  if (multipliers[resultString]) {
    return bet * multipliers[resultString];
  }
  // Prüfe auf 2 gleiche Symbole
  for (const pattern in smallWins) {
    // Zähle, wie oft das Symbol in der Reihe vorkommt
    const count = slotResult.filter(sym => pattern.includes(sym)).length;
    if (count >= 2) {
      return bet * smallWins[pattern];
    }
  }
  return 0;
}

// Hauptexport des Commands
module.exports = {
  name: "slot",
  description: "Spiele die Slot Machine mit animierten Slots!",
  aliases: ["s"],

  async execute(message, args, client) {
    // Nutzer-ID und Einsatz verarbeiten
    const userId = message.author.id;
    const bet = parseInt(args[0]) || 100;
    if (bet <= 0 || isNaN(bet)) return message.reply("❌ Ungültiger Einsatz!");
    
    // Überprüfe, ob der Nutzer genügend Credits hat
    const currentBalance = await getBalance(userId);
    if (currentBalance < bet) return message.reply("❌ Du hast nicht genügend Credits!");

    // Ziehe den Einsatz ab
    await removeBalance(userId, bet);

    // Erstelle ein initiales Embed
    const embed = new EmbedBuilder()
      .setTitle(`🎰 Slot Machine | ${bet}`)
      .setDescription(`Einsatz: ${bet} Credits\n---------------------\n| ❓ | ❓ | ❓ |\n---------------------\n*Die Slots drehen sich...*`)
      .setColor("Gold")
      .setTimestamp();

    const sentMessage = await message.channel.send({ embeds: [embed] });

    // Animation: Slots werden nacheinander animiert
    const slotResult = await animateSlots(sentMessage, embed, bet);

    // Gewinnberechnung
    const winnings = calculateWinnings(slotResult, bet);
    const profit = winnings - bet;
    await addBalance(userId, winnings);

    // XP kann zusätzlich hinzugefügt werden (hier einfach simuliert)
    const xpEarned = Math.floor(bet / 10) + Math.floor(Math.random() * 5);

    // Aktualisiere Embed mit Endergebnis
    embed.setTitle(`🎰 Slot Machine | ${message.author.username}`)
      .setDescription(`Einsatz: ${bet} Credits\n---------------------\n| ${slotResult[0]} | ${slotResult[1]} | ${slotResult[2]} |\n---------------------`)
      .addFields(
        { name: "🎲 Ergebnis", value: winnings > 0 ? `💰 Gewinn: ${winnings} Credits` : "❌ Keine Gewinne" },
        { name: "💸 Profit", value: `${profit} Credits`, inline: true },
        { name: "🎖 XP", value: `+${xpEarned} XP`, inline: true }
      )
      .addFields(
        { name: "💳 Neues Guthaben", value: `Du hast nun ${await getBalance(userId)} Credits` }
      )
      .setColor(winnings > 0 ? "Green" : "Red")
      .setFooter({ text: "Spielergebnis", iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    await sentMessage.edit({ embeds: [embed] });
  }
};
