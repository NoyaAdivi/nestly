<div align="center">

<a href="https://noyaadivi.github.io/nestly/"><img src="icon.svg" alt="Nestly logo" width="110"></a>

# Nestly 🏡

**Shared household chores and shopping list for the whole family**

[![Open Nestly](https://img.shields.io/badge/Open_the_app-c9b8ff?style=for-the-badge&logo=googlechrome&logoColor=2d2a40)](https://noyaadivi.github.io/nestly/)
[![עברית](https://img.shields.io/badge/עברית-ffc6dd?style=for-the-badge)](README.he.md)

</div>

## ✨ Features

| | |
|---|---|
| 🧹 **Smart chores** | Daily, weekly (pick days), every X days or monthly. Done tasks roll to their next date automatically |
| 🔄 **Fair rotation** | A rotating task moves to the next family member each time it is done |
| 🏆 **Points and leaderboard** | Easy / medium / hard tasks earn 5 / 10 / 20 points, weekly champions reset every Sunday |
| 🛒 **Shopping list** | Items sorted by supermarket aisle automatically, quantities, notes, voice input, "buy again" suggestions |
| 💌 **Join by link, code or QR** | Every family member joins from their own phone and sees changes within seconds |
| 💡 **30 ready-made chores** | One tap to add chores by room |
| 📤 **Send the list** | WhatsApp, native share or copy as text |
| ♿ **Accessible** | Text size, dark mode, high contrast, readable font, stop animations, full keyboard and screen reader support |
| 📲 **Installable (PWA)** | Add to home screen, works offline and syncs when back online |

## 🛠️ Tech

Vanilla HTML, CSS and JavaScript (no build step) · [Supabase](https://supabase.com) (Postgres functions, row level security) · GitHub Pages · Service Worker

## 🚀 Run your own

1. Create a free project on [Supabase](https://supabase.com/dashboard) and run [`supabase.sql`](supabase.sql) in the SQL Editor
2. Copy the Project URL and the anon public key into [`config.js`](config.js)
3. Publish with GitHub Pages

Without `config.js` values the app runs in local mode on a single device.

## 🔒 Privacy

The tables are locked with row level security. Data is reachable only through database functions that require the household code.

<div align="center">

Made with 💜 by [Noya Adivi](https://github.com/NoyaAdivi)

</div>
