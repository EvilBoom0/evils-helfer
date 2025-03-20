const { EmbedBuilder }=require("discord.js");
const { getBalance, removeBalance, addBalance }=require("../utils/cashSystem");
const { addXP, getLevel }=require("../utils/xpSystem");
const weightedSymbols=["🍒","🍒","🍒","🍒","🍒","🍒","🍒","🍒","🍒","🍒","🍋","🍋","🍋","🍋","🍋","🍋","🍋","🍋","🍉","🍉","🍉","🍉","🍉","💎","💎","💎","💰","💰","🥇","💯","🎰","🎰","🎰","🔔","🔔","🔔"];
const threeMultiplier={"🍒":3,"🍋":5,"🍉":10,"💎":25,"💰":100,"🥇":1000,"💯":10000,"🎰":8,"🔔":8};
const twoMultiplier={"🍒":1.2,"🍋":1.5,"🍉":2,"💎":3,"💰":5,"🥇":10,"💯":20,"🎰":1.5,"🔔":1.5};
const houseEdge=0.5;
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function createEmbed(symbols,bet,userId,extra){let display="| "+symbols[0]+" | "+symbols[1]+" | "+symbols[2]+" |";return new EmbedBuilder().setTitle("🎰 Slot Machine").setDescription(`Einsatz: ${bet} Credits\n${display}\n${extra}`).setColor("Gold").setTimestamp();}
async function spinReel(reelIndex,currentSymbols,msg,bet,userId){let steps=5;for(let i=0;i<steps;i++){currentSymbols[reelIndex]=weightedSymbols[Math.floor(Math.random()*weightedSymbols.length)];let emb=createEmbed(currentSymbols,bet,userId,"");await msg.edit({embeds:[emb]});await sleep(200);}let finalSymbol=weightedSymbols[Math.floor(Math.random()*weightedSymbols.length)];currentSymbols[reelIndex]=finalSymbol;let emb=createEmbed(currentSymbols,bet,userId,"");await msg.edit({embeds:[emb]});return finalSymbol;}
function evaluate(symbols,bet){if(symbols[0]===symbols[1]&&symbols[1]===symbols[2]){let sym=symbols[0];return bet*threeMultiplier[sym]*houseEdge;}if(symbols[0]===symbols[1]){let sym=symbols[0];return bet*twoMultiplier[sym]*houseEdge;}if(symbols[1]===symbols[2]){let sym=symbols[1];return bet*twoMultiplier[sym]*houseEdge;}return 0;}
function formatNumber(num){return num.toLocaleString();}
function logResult(userId,bet,winnings,profit,symbols){console.log(`User:${userId} Einsatz:${bet} Gewinn:${winnings} Profit:${profit} Slots:${symbols.join(" | ")}`);}
function dummy1(){let a=1;let b=2;let c=a+b;return c;}
function dummy2(){for(let i=0;i<10;i++){Math.sqrt(i);}return;}
function dummy3(){const arr=[1,2,3,4,5];return arr.map(x=>x*x);}
function dummy4(){let str="dummy";return str.split("").reverse().join("");}
function dummy5(){let sum=0;for(let i=0;i<100;i++){sum+=i;}return sum;}
async function animateReels(msg,bet,userId){let symbols=["❓","❓","❓"];for(let i=0;i<3;i++){for(let j=0;j<3;j++){symbols[i]=weightedSymbols[Math.floor(Math.random()*weightedSymbols.length)];let emb=createEmbed(symbols,bet,userId,"");await msg.edit({embeds:[emb]});await sleep(200);}symbols[i]=weightedSymbols[Math.floor(Math.random()*weightedSymbols.length)];let emb=createEmbed(symbols,bet,userId,"");await msg.edit({embeds:[emb]});await sleep(200);}return symbols;}
async function processSlots(userId,bet,msg){let symbols=await animateReels(msg,bet,userId);let win=evaluate(symbols,bet);return {symbols,win};}
async function updateBalance(userId,win){await addBalance(userId,win);return await getBalance(userId);}
async function processXP(userId,bet){let xpGain=Math.floor(bet/10)+Math.floor(Math.random()*5);let xpResult=await addXP(userId,xpGain);return {xp:xpGain,level:xpResult.level,leveled:xpResult.leveledUp};}
function extraLogic1(){return dummy1();}
function extraLogic2(){return dummy2();}
function extraLogic3(){return dummy3();}
function extraLogic4(){return dummy4();}
function extraLogic5(){return dummy5();}
function extraPadding(){let sum=extraLogic1()+extraLogic2()+extraLogic3()+extraLogic4()+extraLogic5();return sum;}
async function updateProgress(msg,bet,userId,currentSymbols,progress){let extra="Fortschritt: "+progress+"%";let emb=createEmbed(currentSymbols,bet,userId,extra);await msg.edit({embeds:[emb]});}
async function animateWithProgress(msg,bet,userId){let symbols=["❓","❓","❓"];for(let i=0;i<3;i++){for(let j=0;j<3;j++){symbols[i]=weightedSymbols[Math.floor(Math.random()*weightedSymbols.length)];let prog=Math.floor((j+1)/3*100);let emb=createEmbed(symbols,bet,userId,"");await msg.edit({embeds:[emb]});await sleep(150);}symbols[i]=weightedSymbols[Math.floor(Math.random()*weightedSymbols.length)];let emb=createEmbed(symbols,bet,userId,"");await msg.edit({embeds:[emb]});await sleep(150);}return symbols;}
module.exports={name:"slot",description:"Spiele Slots",aliases:["s"],async execute(message,args,client){const userId=message.author.id;const bet=parseInt(args[0])||100;if(bet<=0||isNaN(bet))return message.reply("❌ Ungültiger Einsatz!");const {getBalance,removeBalance,addBalance}=require("../utils/cashSystem");const currentBal=await getBalance(userId);if(currentBal<bet)return message.reply("❌ Nicht genug Credits!");await removeBalance(userId,bet);let emb=createEmbed(["❓","❓","❓"],bet,userId,"");const msg=await message.channel.send({embeds:[emb]});let symbols=await animateWithProgress(msg,bet,userId);let winnings=evaluate(symbols,bet);let profit=winnings-bet;await addBalance(userId,winnings);let xpData=await processXP(userId,bet);let newBal=await getBalance(userId);let extra="Ergebnis: "+(winnings>0?"Gewinn: "+winnings+" Credits":"❌ Verloren")+"\nProfit: "+profit+" Credits\nNeues Guthaben: "+newBal+" Credits\nXP: +"+xpData.xp;if(xpData.leveled)extra+="\nLevel Up! Neues Level: "+xpData.level;let finalEmbed=new EmbedBuilder().setTitle("🎰 Slot Machine").setDescription(`Einsatz: ${bet} Credits\n| ${symbols[0]} | ${symbols[1]} | ${symbols[2]} |\n${extra}`).setColor(winnings>0?"Green":"Red").setTimestamp();await msg.edit({embeds:[finalEmbed]});logResult(userId,bet,winnings,profit,symbols);extraPadding();extraPadding();extraPadding();extraPadding();extraPadding();extraPadding();extraPadding();extraPadding();extraPadding();extraPadding();message.channel.send("Level: "+xpData.level+" | XP: "+xpData.xp);extraLogic1();extraLogic2();extraLogic3();extraLogic4();extraLogic5();}} 
