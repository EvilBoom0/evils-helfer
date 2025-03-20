const {EmbedBuilder} = require("discord.js");
const {getBalance, removeBalance, addBalance} = require("../utils/cashSystem");
const {addXP} = require("../utils/xpSystem");
const weightedSymbols = [
"🍒",
"🍒",
"🍒",
"🍒",
"🍒",
"🍒",
"🍒",
"🍒",
"🍒",
"🍒",
"🍋",
"🍋",
"🍋",
"🍋",
"🍋",
"🍋",
"🍋",
"🍋",
"🍉",
"🍉",
"🍉",
"🍉",
"🍉",
"💎",
"💎",
"💎",
"💰",
"💰",
"🥇",
"💯",
"🎰",
"🎰",
"🔔",
"🔔",
"🍇",
"🍏"
];
const threeMultiplier = {
"🍒":3,
"🍋":5,
"🍉":10,
"💎":25,
"💰":100,
"🥇":1000,
"💯":10000,
"🎰":8,
"🔔":8,
"🍇":2,
"🍏":2
};
const twoMultiplier = {
"🍒":1.5,
"🍋":2,
"🍉":3,
"💎":4,
"💰":5,
"🥇":10,
"💯":20,
"🎰":2,
"🔔":2,
"🍇":1.2,
"🍏":1.2
};
const houseEdgeFactor = 0.49;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function createSlotEmbed(symbolsArray,bet,userId) {
let display="---------------------\n| "+symbolsArray[0]+" | "+symbolsArray[1]+" | "+symbolsArray[2]+" |\n---------------------";
let embed = new EmbedBuilder();
embed.setTitle("🎰 Slot Machine");
embed.setDescription("Einsatz: "+bet+" Credits\n"+display);
embed.setColor("Gold");
embed.setTimestamp();
return embed;
}
async function spinReel(reelIndex,currentSymbols,sentMessage,bet,userId) {
const steps = 8;
for(let i=0;i<steps;i++){
currentSymbols[reelIndex]=weightedSymbols[Math.floor(Math.random()*weightedSymbols.length)];
let embed = createSlotEmbed(currentSymbols,bet,userId);
await sentMessage.edit({embeds:[embed]});
await sleep(200);
}
let finalSymbol = weightedSymbols[Math.floor(Math.random()*weightedSymbols.length)];
currentSymbols[reelIndex]=finalSymbol;
let embed = createSlotEmbed(currentSymbols,bet,userId);
await sentMessage.edit({embeds:[embed]});
return finalSymbol;
}
function evaluateResult(symbolsArray,bet) {
if(symbolsArray[0]===symbolsArray[1] && symbolsArray[1]===symbolsArray[2]){
let multiplier = threeMultiplier[symbolsArray[0]]||0;
return bet*multiplier*houseEdgeFactor;
}
if(symbolsArray[0]===symbolsArray[1]){
let multiplier = twoMultiplier[symbolsArray[0]]||0;
return bet*multiplier*houseEdgeFactor;
}
if(symbolsArray[1]===symbolsArray[2]){
let multiplier = twoMultiplier[symbolsArray[1]]||0;
return bet*multiplier*houseEdgeFactor;
}
return 0;
}
async function createResultEmbed(sentMessage,currentSymbols,bet,userId) {
const winnings = evaluateResult(currentSymbols,bet);
const profit = winnings - bet;
let embed = new EmbedBuilder();
embed.setTitle("🎰 Slot Machine Result");
let display = "---------------------\n| "+currentSymbols[0]+" | "+currentSymbols[1]+" | "+currentSymbols[2]+" |\n---------------------";
embed.setDescription("Einsatz: "+bet+" Credits\n"+display);
if(winnings>0){
embed.addFields({name:"Ergebnis",value:"Gewinn: "+winnings+" Credits",inline:true});
}else{
embed.addFields({name:"Ergebnis",value:"❌ YOU LOST",inline:true});
}
embed.addFields({name:"Profit",value:profit+" Credits",inline:true});
embed.setColor(winnings>0?"Green":"Red");
embed.setTimestamp();
return {embed,winnings,profit};
}
async function updateXP(userId,bet) {
let xpGain = Math.floor(bet/10)+Math.floor(Math.random()*5);
await addXP(userId,xpGain);
return xpGain;
}
const fs = require("fs");
function formatCredits(amount) {
return amount.toLocaleString()+" Credits";
}
function formatXP(xp) {
return xp+" XP";
}
function logSlotResult(userId,bet,winnings,profit,slotResult) {
const now = new Date().toISOString();
const logEntry = now+" | "+userId+" | Bet: "+bet+" | Slots: "+slotResult.join(" | ")+" | Winnings: "+winnings+" | Profit: "+profit+"\n";
fs.appendFileSync("slots.log",logEntry);
}
async function updateUserRecord(userId,bet,winnings,xpGain,slotResult) {
try {
const balance = await getBalance(userId);
console.log("User",userId,"updated. New balance:",balance);
logSlotResult(userId,bet,winnings,winnings-bet,slotResult);
}catch(err){
console.error("Error updating user record for",userId,err);
}
}
function delay(ms) {
return new Promise(resolve=>setTimeout(resolve,ms));
}
async function animateSlots(sentMessage,currentSymbols,bet,userId) {
for(let reel=0;reel<3;reel++){
await spinReel(reel,currentSymbols,sentMessage,bet,userId);
}
return currentSymbols;
}
async function processSlotGame(userId,bet,sentMessage) {
let symbolsArr = ["❓","❓","❓"];
symbolsArr = await animateSlots(sentMessage,symbolsArr,bet,userId);
const result = evaluateResult(symbolsArr,bet);
const profitCalc = result - bet;
return {symbolsArr,result,profitCalc};
}
async function displayFinalResult(sentMessage,embed,userId,bet,xpGain) {
const newBalance = await getBalance(userId);
embed.addFields({name:"Guthaben",value:"Dein Guthaben: "+formatCredits(newBalance),inline:false});
embed.addFields({name:"XP",value:"Du hast "+formatXP(xpGain)+" verdient.",inline:false});
await sentMessage.edit({embeds:[embed]});
}
async function runSlotAnimation(message,args,client) {
const userId = message.author.id;
const bet = parseInt(args[0]) || 100;
if(bet<=0||isNaN(bet)) { return message.reply("Ungültiger Einsatz!"); }
const balance = await getBalance(userId);
if(balance<bet) { return message.reply("Nicht genug Credits!"); }
await removeBalance(userId,bet);
let symbolsArr = ["❓","❓","❓"];
let embed = createSlotEmbed(symbolsArr,bet,userId);
const sentMessage = await message.channel.send({embeds:[embed]});
const resultData = await processSlotGame(userId,bet,sentMessage);
const finalSymbols = resultData.symbolsArr;
const winnings = resultData.result;
const profitCalc = resultData.profitCalc;
await addBalance(userId,winnings);
const xpGain = await updateXP(userId,bet);
const resultEmbedData = await createResultEmbed(sentMessage,finalSymbols,bet,userId);
resultEmbedData.embed.addFields({name:"Guthaben",value:"Dein Guthaben: "+formatCredits(await getBalance(userId)),inline:false});
resultEmbedData.embed.addFields({name:"XP",value:"Du hast "+formatXP(xpGain)+" verdient.",inline:false});
await sentMessage.edit({embeds:[resultEmbedData.embed]});
await updateUserRecord(userId,bet,winnings,xpGain,finalSymbols);
console.log("Slot result for",userId,":",finalSymbols.join(" | "), "Bet:",bet,"Winnings:",winnings,"Profit:",profitCalc);
}
module.exports.runSlotAnimation = runSlotAnimation;
module.exports.execute = async (message,args,client) => { await runSlotAnimation(message,args,client); };
