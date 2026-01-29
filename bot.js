import logging
import asyncio
import random
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

API_TOKEN = '8543455532:AAEJHCJ8K-K7FzIwwrf0uIfdujxKZeMu1bo'

logging.basicConfig(level=logging.INFO)
bot = Bot(token=API_TOKEN)
dp = Dispatcher()

# O'yin ma'lumotlari
game_data = {
    "is_joinable": False,
    "players": {}, # {user_id: {"name": str, "role": str, "is_alive": bool}}
    "phase": "lobby" # lobby, night, day
}

def assign_roles(player_ids):
    count = len(player_ids)
    roles = ["Mafia"] * (count // 4 if count >= 4 else 1)
    roles.append("Sherif")
    roles.append("Doktor")
    while len(roles) < count:
        roles.append("Fuqaro")
    
    random.shuffle(roles)
    return roles

@dp.message(Command("start_lobby"))
async def start_lobby(message: types.Message):
    game_data["is_joinable"] = True
    game_data["players"] = {}
    await message.answer("O'yin uchun ro'yxatga olish boshlandi! /join buyrug'ini bering.")

@dp.message(Command("join"))
async def join_game(message: types.Message):
    if not game_data["is_joinable"]:
        return await message.answer("Hozircha hech qanday o'yin ochilmagan.")
    
    user_id = message.from_user.id
    if user_id not in game_data["players"]:
        game_data["players"][user_id] = {"name": message.from_user.full_name, "is_alive": True}
        await message.answer(f"{message.from_user.first_name} qo'shildi! Soni: {len(game_data['players'])}")

@dp.message(Command("start_game"))
async def start_game(message: types.Message):
    player_ids = list(game_data["players"].keys())
    if len(player_ids) < 4:
        return await message.answer("Kamida 4 kishi kerak!")

    game_data["is_joinable"] = False
    roles = assign_roles(player_ids)
    
    for p_id, role in zip(player_ids, roles):
        game_data["players"][p_id]["role"] = role
        try:
            await bot.send_message(p_id, f"Sizning rolingiz: **{role}**")
        except:
            await message.answer(f"{game_data['players'][p_id]['name']} botga start bosmagan!")

    await message.answer("Rollar tarqatildi. Shaharda tun tushmoqda... 🌃")
    await start_night_phase(message.chat.id)

async def start_night_phase(chat_id):
    game_data["phase"] = "night"
    await bot.send_message(chat_id, "Tun boshlandi. Mafia o'z qurbonini tanlamoqda...")
    # Bu yerda Mafia uchun tugmalar chiqarish va ovoz olish mantiqi bo'ladi

@dp.message(Command("status"))
async def check_status(message: types.Message):
    text = "Tirik o'yinchilar:\n"
    for p in game_data["players"].values():
        if p["is_alive"]:
            text += f"- {p['name']}\n"
    await message.answer(text)

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())

        
