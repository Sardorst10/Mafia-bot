const { Telegraf } = require('telegraf');

// Sizning bot tokeningiz
const bot = new Telegraf('8543455532:AAEJHCJ8K-K7FzIwwrf0uIfdujxKZeMu1bo');

bot.start((ctx) => ctx.reply('🚀 Mafia Bot 24/7 rejimda ishlamoqda!'));

// Render hostingi uchun majburiy qism (bot o'chib qolmasligi uchun)
const http = require('http');
http.createServer((req, res) => {
    res.write("Bot is alive");
    res.end();
}).listen(process.env.PORT || 3000);

bot.launch().then(() => console.log("✅ Bot ishga tushdi!"));
