const { Telegraf, Markup, session } = require('telegraf');
const http = require('http');

const bot = new Telegraf('8543455532:AAEJHCJ8K-K7FzIwwrf0uIfdujxKZeMu1bo');
bot.use(session());

const db = {}; // Foydalanuvchilar bazasi (tanga, reyting, til)

const strings = {
    uz: { shop: "Do'kon 🛒", join: "Qo'shilish ✅", start: "Boshlash 🚀", hide: "Mafiyani yashirish (80💰)", info: "Profil 👤", roles: { mafia: "Siz Mafiyasiz! 🔥", civ: "Siz Tinch aholisiz! 🏘", don: "Siz Donsiz! 🎩" } },
    ru: { shop: "Магазин 🛒", join: "Присоединиться ✅", start: "Начать 🚀", hide: "Скрыть мафию (80💰)", info: "Профиль 👤", roles: { mafia: "Вы Мафия! 🔥", civ: "Вы Мирный! 🏘", don: "Вы Дон! 🎩" } },
    en: { shop: "Shop 🛒", join: "Join ✅", start: "Start 🚀", hide: "Hide Mafia (80💰)", info: "Profile 👤", roles: { mafia: "You are Mafia! 🔥", civ: "You are Civilian! 🏘", don: "You are Don! 🎩" } }
    // Qolgan tillar ham shu formatda qo'shiladi
};

const getU = (id, name) => {
    if (!db[id]) db[id] = { money: 100, rating: 0, items: [], lang: 'uz', name: name };
    return db[id];
};

// 1. TIL VA ASOSIY MENYU
bot.start((ctx) => {
    getU(ctx.from.id, ctx.from.first_name);
    ctx.reply("🌐 Select Language / Tilni tanlang:", Markup.inlineKeyboard([
        [Markup.button.callback('🇺🇿 O\'zbek', 'set_uz'), Markup.button.callback('🇷🇺 Русский', 'set_ru')],
        [Markup.button.callback('🇺🇸 English', 'set_en'), Markup.button.callback('🇹🇷 Türkçe', 'set_tr')]
    ]));
});

bot.action(/set_(.+)/, (ctx) => {
    const lang = ctx.match[1];
    getU(ctx.from.id).lang = lang;
    const s = strings[lang] || strings.uz;
    ctx.reply(`🎭 Mafia Baku Pro!`, Markup.keyboard([[s.join, s.start], [s.shop, s.info]]).resize());
});

// 2. DO'KON (MAFIYA LIGINI YASHIRISH)
bot.hears(["Do'kon 🛒", "Магазин 🛒", "Shop 🛒"], (ctx) => {
    const u = getU(ctx.from.id);
    const s = strings[u.lang] || strings.uz;
    ctx.reply(`💰 Balans: ${u.money}\n🛒 Buyumni tanlang:`, Markup.inlineKeyboard([
        [Markup.button.callback(s.hide, 'buy_mask')]
    ]));
});

bot.action('buy_mask', (ctx) => {
    const u = getU(ctx.from.id);
    if (u.money >= 80) {
        u.money -= 80;
        u.items.push('hide_mafia');
        ctx.answerCbQuery("Sotib olindi! ✅", { show_alert: true });
    } else {
        ctx.answerCbQuery("Pul yetarli emas! ❌", { show_alert: true });
    }
});

// 3. O'YIN BOSHLASH VA ROLLAR
let lobby = [];
bot.hears(["Qo'shilish ✅", "Присоединиться ✅", "Join ✅"], (ctx) => {
    if (!lobby.find(p => p.id === ctx.from.id)) {
        lobby.push({ id: ctx.from.id, name: ctx.from.first_name });
        ctx.reply(`✅ Jami o'yinchilar: ${lobby.length}`);
    }
});

bot.hears(["Boshlash 🚀", "Начать 🚀", "Start 🚀"], (ctx) => {
    if (lobby.length < 3) return ctx.reply("Kamida 3 kishi kerak! 👥");
    
    lobby.forEach((p, i) => {
        const u = getU(p.id);
        const s = strings[u.lang] || strings.uz;
        const role = i === 0 ? s.roles.mafia : s.roles.civ; // Namuna uchun
        bot.telegram.sendMessage(p.id, role);
    });
    ctx.reply("🎲 Rollar shaxsiyga yuborildi! O'yin boshlandi.");
    lobby = []; 
});

// RENDER HOSTINGI UCHUN "ALIVE" SERVISI
const server = http.createServer((req, res) => { res.write("Mafia Baku Pro is Live"); res.end(); });
server.listen(process.env.PORT || 3000);

bot.launch().then(() => console.log("🚀 Mafia Baku Pro ishga tushdi!"));
