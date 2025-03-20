module.exports = {
    name: "guildMemberAdd",
    execute(member) {
        console.log(`👋 Neuer User: ${member.user.tag} ist dem Server beigetreten.`);
        member.guild.systemChannel?.send(`Willkommen, ${member.user.tag}! 🎉`);
    },
};
