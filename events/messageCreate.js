module.exports = {
    name: "messageCreate",
    execute(message) {
        if (message.content === "hi") {
            message.reply("Hallo! 😊");
        }
    },
};
