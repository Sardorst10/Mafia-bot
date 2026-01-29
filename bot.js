const { Telegraf, Markup, session } = require('telegraf');
const http = require('http');

const bot = new Telegraf('8543455532:AAEJHCJ8K-K7FzIwwrf0uIfdujxKZeMu1bo');
bot.use(session());

const db = {}; 

const strings = {
    uz: { welcome: "<b>Mafia Boss</b>", join: "Qo'shilish ✅", start: "Boshlash 🚀", shop: "Do'kon 🛒", hide: "Mafiyani yashirish (80💰)", info: "Profil 👤", group_err: "❌ Bu buyruq faqat guruhda ishlaydi!" },
    ru: { welcome: "<b>Mafia Boss</b>", join: "Присоединиться ✅", start: "Начать 🚀", shop: "Магазин 🛒", hide: "Скрыть мафию (80💰)", info: "Профиль 👤", group_err: "❌ Команда только для групп!" },
    en: { welcome: "<b>Mafia Boss</b>", join: "Join ✅", start: "Start 🚀", shop: "Shop 🛒", hide: "Hide Mafia (80💰)", info: "Profile 👤", group_err: "❌ Group only command!" },
    tr: { welcome: "<b>Mafia Boss</b>", join: "Katıl ✅", start: "Başlat 🚀", shop: "Mağaza 🛒", hide: "Mafyayı gizle (80💰)", info: "Profil 👤", group_err: "❌ Sadece grup komutu!" },
    az: { welcome: "<b>Mafia Boss</b>", join: "Qoşul ✅", start: "Başlat 🚀", shop: "Mağaza 🛒", hide: "Mafiyanı gizlə (80💰)", info: "Profil 👤", group_err: "❌ Yalnız qrup komandası!" },
    kg: { welcome: "<b>Mafia Boss</b>", join: "Кошулуу ✅", start: "Баштоо 🚀", shop: "Дүкөн 🛒", hide: "Мафияны жашыруу (80💰)", info: "Профиль 👤", group_err: "❌ Топ үчүн гана!" },
    kz: { welcome: "<b>Mafia Boss</b>", join: "Қосылу ✅", start: "Бастау 🚀", shop: "Дүкен 🛒", hide: "Мафияны жасыру (80💰)", info: "Профиль 👤", group_err: "❌ Тек топқа арналған!" },
    tj: { welcome: "<b>Mafia Boss</b>", join: "Пайваст шудан ✅", start: "Оғоз 🚀", shop: "Дӯкон 🛒", hide: "Пинҳон кардани мафия (80💰)", info: "Профил 👤", group_err: "❌ Танҳо барои гурӯҳ!" },
    de: { welcome: "<b>Mafia Boss</b>", join: "Beitreten ✅", start: "Starten 🚀", shop: "Shop 🛒", hide: "Mafia verstecken (80💰)", info: "Profil 👤", group_err: "❌ Nur Gruppenbefehl!" },
    fr: { welcome: "<b>Mafia Boss</b>", join: "Rejoindre ✅", start: "Démarrer 🚀", shop: "Boutique 🛒", hide: "Cacher la Mafia (80💰)", info: "Profil 👤", group_err: "❌ Commande de groupe uniquement!" }
};

const getU = (id, name) => {
    if (!db[id]) db[id] = { money: 100, rating: 0, wins: 0, games: 0, items: [], lang: 'uz', name: name };
    return db[id];
};

bot.start((ctx) => {
    if (ctx.chat.type !== 'private') return;
    getU(ctx.from.id, ctx.from.first_name);
    ctx.reply("🌐 Select Language / Tilni tanlang:", Markup.inlineKeyboard([
        [Markup.button.callback('🇺🇿 UZ', 'set_uz'), Markup.button.callback('🇷🇺 RU', 'set_ru'), Markup.button.callback('🇺🇸 EN', 'set_en'), Markup.button.callback('🇹🇷 TR', 'set_tr')],
        [Markup.button.callback('🇦🇿 AZ', 'set_az'), Markup.button.callback('🇰🇬 KG', 'set_kg'), Markup.button.callback('🇰🇿 KZ', 'set_kz'), Markup.button.callback('🇹🇯 TJ', 'set_tj')],
        [Markup.button.callback('🇩🇪 DE', 'set_de'), Markup.button.callback('🇫🇷 FR', 'set_fr')]
    ]));
});

bot.action(/set_(.+)/, (ctx) => {
    const lang = ctx.match[1];
    getU(ctx.from.id).lang = lang;
    const s = strings[lang] || strings.uz;
    ctx.replyWithHTML(s.welcome, Markup.keyboard([[s.shop, s.info]]).resize());
});

bot.hears(["Profil 👤", "Профиль 👤", "Profile 👤", "Profil 👤"], (ctx) => {
    const u = getU(ctx.from.id, ctx.from.first_name);
    ctx.replyWithHTML(`👤 <b>Ism:</b> ${u.name}\n💰 <b>Pul:</b> ${u.money}💰\n🏆 <b>Reyting:</b> ${u.rating}\n🎮 <b>O'yinlar:</b> ${u.games}\n🥇 <b>G'alabalar:</b> ${u.wins}`);
});

let lobby = {};
bot.command('join', (ctx) => {
    if (ctx.chat.type === 'private') return ctx.reply(strings.uz.group_err);
    const gid = ctx.chat.id;
    if (!lobby[gid]) lobby[gid] = [];
    if (!lobby[gid].find(p => p.id === ctx.from.id)) {
        lobby[gid].push({ id: ctx.from.id, name: ctx.from.first_name });
        ctx.reply(`✅ ${ctx.from.first_name} qo'shildi! Jami: ${lobby[gid].length}`);
    }
});

bot.command('run', (ctx) => {
    const gid = ctx.chat.id;
    if (ctx.chat.type === 'private' || !lobby[gid] || lobby[gid].length < 3) return ctx.reply("Kamida 3 kishi /join qilishi kerak!");
    lobby[gid].forEach((p) => {
        getU(p.id, p.name).games += 1;
        bot.telegram.sendMessage(p.id, "🎮 O'yin boshlandi! Rolingiz shaxsiyga yuborildi.");
    });
    ctx.reply("🎲 Rollar tarqatildi. O'yin boshlandi!");
    lobby[gid] = [];
});

http.createServer((req, res) => { res.write("Mafia Boss is Live"); res.end(); }).listen(process.env.PORT || 3000);
bot.launch().then(() => console.log("🚀 Mafia Boss 10-lang Online!"));
                                                                          
