const { EmbedBuilder } = require("discord.js");

// Slot-Symbole & Multiplikatoren
const symbols = ["🍒", "🍋", "🍉", "💎", "💰", "🥇", "💯", "🎰", "🔔"];
const multipliers = {
  "🍒🍒🍒": 2,   // 2x
  "🍋🍋🍋": 3,   // 3x
  "🍉🍉🍉": 5,   // 5x
  "💎💎💎": 10,  // 10x
  "💰💰💰": 100, // 100x
  "🥇🥇🥇": 1000,// 1000x
  "💯💯💯": 10000 // 10000x (Jackpot - Extrem selten)
};

// Nutzer-Datenbank (Fake für Testing, später durch echte Datenbank ersetzen)
let userCredits = {};
let userXP = {};

// Funktion zum Ziehen eines Slots
function getRandomSlot() {
  return [symbols[Math.floor(Math.random() * symbols.length)], 
          symbols[Math.floor(Math.random() * symbols.length)], 
          symbols[Math.floor(Math.random() * symbols.length)]];
}

// Funktion zum Ermitteln des Gewinnmultiplikators
function getMultiplier(slotResult) {
  const result = slotResult.join(""); // Array zu String (z.B. "🍒🍒🍒")
  return multipliers[result] || 0; // Falls kein Gewinn, gibt es 0 zurück
}

module.exports = {
  name: "slot",
  description: "Spiele die Slot Machine und versuche dein Glück!",
  aliases: ["s"],
  
  async execute(message, args, client) {
    const userId = message.author.id;
    
    // Nutzer initialisieren, falls nicht existierend
    if (!userCredits[userId]) userCredits[userId] = 1000; // Startguthaben
    if (!userXP[userId]) userXP[userId] = 0;

    const bet = parseInt(args[0]) || 100; // Standardwette 100 Credits
    if (bet <= 0 || isNaN(bet)) return message.reply("❌ Ungültiger Einsatz!");
    if (userCredits[userId] < bet) return message.reply("❌ Du hast nicht genug Credits!");

    // Ziehe die Slots
    const slotResult = getRandomSlot();
    const multiplier = getMultiplier(slotResult);

    // Berechne den Gewinn
    const winnings = bet * multiplier;
    const profit = winnings - bet;
    userCredits[userId] += profit;
    userXP[userId] += Math.floor(bet / 10) + Math.floor(Math.random() * 10); // Zufälliges XP-Gewinnsystem

    // Erstelle das Slot-Embed mit Live-Animation (Fake-Update für Discord)
    const embed = new EmbedBuilder()
      .setTitle(`🎰 Slot Machine | ${message.author.username}`)
      .setDescription(`**Einsatz:** ${bet} Credits\n*Die Slots drehen sich...*`)
      .setColor("Gold");

    const sentMessage = await message.channel.send({ embeds: [embed] });

    // Fake-Animation mit Update nach 2 Sekunden
    setTimeout(async () => {
      embed.setDescription(`**Einsatz:** ${bet} Credits\n---------------------\n| ${slotResult[0]} | ${slotResult[1]} | ${slotResult[2]} |\n---------------------`)
        .addFields(
          { name: "🎲 Ergebnis", value: multiplier > 0 ? `💰 **Gewinn:** ${winnings} Credits` : "❌ **YOU LOST**" },
          { name: "💸 Profit", value: `${profit} Credits`, inline: true },
          { name: "🎖 XP", value: `+${Math.floor(bet / 10)}`, inline: true },
          { name: "💳 Guthaben", value: `Du hast nun **${userCredits[userId]} Credits**`, inline: false }
        )
        .setColor(multiplier > 0 ? "Green" : "Red");

      await sentMessage.edit({ embeds: [embed] });
    }, 2000);
  },
};
