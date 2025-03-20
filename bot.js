require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config/config.json"); // Lädt die Konfigurationsdatei

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// 🔹 Befehle laden (commands/)
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    console.log(`✅ Befehl geladen: ${command.name}`);
}

// 🔹 Events laden (events/)
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`🔹 Event geladen: ${event.name}`);
}

// 🔹 Nachrichten-Handler
client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`❌ Fehler beim Ausführen von ${commandName}:`, error);
        message.reply("Es gab einen Fehler beim Ausführen dieses Befehls.");
    }
});

// 🟢 Bot starten
client.once("ready", () => {
    console.log(`✅ Bot ist online als ${client.user.tag}`);
    client.user.setActivity("mit Befehlen", { type: "PLAYING" });
});

// 🔹 Bot-Login mit Token aus .env
client.login(process.env.DISCORD_TOKEN);
