
import logging
import asyncio
import random
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

# --- KONFIGURATSIYA ---
API_TOKEN = '8543455532:AAFS_bmtXhD-Dem8MP0IqJUht9cJJUrMmF8' # @BotFather dan olgan tokenni yozing
logging.basicConfig(level=logging.INFO)
bot = Bot(token=API_TOKEN)
dp = Dispatcher()

# --- O'YIN MA'LUMOTLARI ---
class Game:
    def __init__(self):
        self.is_started = False
        self.players = {}  # {user_id: {name, role, alive, votes, side}}
        self.phase = "LOBBY"  # LOBBY, NIGHT, DAY
        self.night_actions = {"kill": None, "heal": None, "check": None}
        self.chat_id = None

game = Game()

# --- YORDAMCHI FUNKSIYALAR ---
def get_alive_players():
    return {uid: p for uid, p in game.players.items() if p['alive']}

async def broadcast(text):
    if game.chat_id:
        await bot.send_message(game.chat_id, text)

# --- BUYRUQLAR ---
@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer("Mafia Botga xush kelibsiz!\n/join - O'yinga qo'shilish\n/start_game - O'yinni boshlash")

@dp.message(Command("join"))
async def cmd_join(message: types.Message):
    if game.is_started:
        return await message.answer("O'yin allaqachon boshlangan.")
    
    uid = message.from_user.id
    if uid not in game.players:
        game.players[uid] = {
            "name": message.from_user.full_name,
            "role": None,
            "alive": True,
            "votes": 0,
            "side": None # "mafia" yoki "city"
        }
        game.chat_id = message.chat.id
        await message.answer(f"✅ {message.from_user.first_name} qo'shildi! Jami: {len(game.players)}")

@dp.message(Command("start_game"))
async def start_game(message: types.Message):
    count = len(game.players)
    if count < 4:
        return await message.answer("Kamida 4 kishi kerak!")
    
    game.is_started = True
    pids = list(game.players.keys())
    random.shuffle(pids)

    # Rollarni taqsimlash
    roles_pool = ["MAFIA", "SHERIF", "DOKTOR"] + ["FUQARO"] * (count - 3)
    random.shuffle(roles_pool)

    for pid, role in zip(pids, roles_pool):
        game.players[pid]["role"] = role
        game.players[pid]["side"] = "mafia" if role == "MAFIA" else "city"
        try:
            await bot.send_message(pid, f"Sizning rolingiz: {role}")
        except:
            await message.answer(f"⚠️ {game.players[pid]['name']} botga start bosmagan!")

    await broadcast("🎭 Rollar tarqatildi! Shaharda tun boshlanmoqda... 🌃")
    await start_night()

# --- TUNGI FAZA ---
async def start_night():
    game.phase = "NIGHT"
    game.night_actions = {"kill": None, "heal": None, "check": None}
    
    for uid, p in get_alive_players().items():
        if p["role"] == "MAFIA":
            await send_menu(uid, "Kimni o'ldiramiz?", "kill")
        elif p["role"] == "DOKTOR":
            await send_menu(uid, "Kimni davolaymiz?", "heal")
        elif p["role"] == "SHERIF":
            await send_menu(uid, "Kimni tekshiramiz?", "check")
    
    await asyncio.sleep(30) # O'yinchilarga 30 soniya vaqt
    await end_night()

async def send_menu(pid, text, action):
    kb = []
    for target_id, tdata in get_alive_players().items():
        if target_id != pid:
            kb.append([InlineKeyboardButton(text=tdata['name'], callback_data=f"{action}:{target_id}")])
    await bot.send_message(pid, text, reply_markup=InlineKeyboardMarkup(inline_keyboard=kb))

# --- CALLBACK HANDLING ---
@dp.callback_query(F.data.startswith(("kill:", "heal:", "check:")))
async def handle_actions(call: types.CallbackQuery):
    action, target_id = call.data.split(":")
    target_id = int(target_id)
    game.night_actions[action] = target_id
    
    if action == "check":
        res = "MAFIA" if game.players[target_id]["role"] == "MAFIA" else "TINCH"
        await call.message.edit_text(f"Natija: Bu odam {res}")
    else:
        await call.message.edit_text("Tanlov qabul qilindi.")

# --- KUNGI FAZA ---
async def end_night():
    game.phase = "DAY"
    killed = game.night_actions["kill"]
    healed = game.night_actions["heal"]

    msg = "☀️ Shaharda tong otdi!\n"
    if killed and killed != healed:
        game.players[killed]["alive"] = False
        msg += f"💀 Afsuski, bugun tunda {game.players[killed]['name']} o'ldirildi."
    else:
        msg += "🌙 Tun tinch o'tdi, hech kim o'lmadi."
    
    await broadcast(msg)
    if check_win(): return

    await broadcast("🗣 Endi muhokama va ovoz berish vaqti! Shubhali shaxsni tanlang: /vote")

@dp.message(Command("vote"))
async def cmd_vote(message: types.Message):
    if game.phase != "DAY": return
    await send_menu(message.chat.id, "Kimga ovoz berasiz?", "vote")

@dp.callback_query(F.data.startswith("vote:"))
async def handle_vote(call: types.CallbackQuery):
    target_id = int(call.data.split(":")[1])
    game.players[target_id]["alive"] = False
    name = game.players[target_id]["name"]
    role = game.players[target_id]["role"]
    
    await broadcast(f"⚖️ Xalq qarori bilan {name} qatl qilindi! Uning roli: {role}")
    
    if not check_win():
        await broadcast("Yana tun tushmoqda... 🌃")
        await start_night()

# --- G'ALABA TEKSHIRUVI ---
def check_win():
    alive = get_alive_players()
    mafias = [p for p in alive.values() if p["side"] == "mafia"]
    city = [p for p in alive.values() if p["side"] == "city"]

    if not mafias:
        asyncio.create_task(broadcast("🎉 G'ALABA! Shahar mafiyadan qutuldi!"))
        reset_game()
        return True
    if len(mafias) >= len(city):
        asyncio.create_task(broadcast("🔥 MAFIYA G'ALABA QILDI! Shahar ularning qo'lida!"))
        reset_game()
        return True
    return False

def reset_game():
    game.is_started = False
    game.players = {}

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
                              
