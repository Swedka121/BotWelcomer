# Discord Bot Welcomer

A simple Discord bot for managing welcome messages with customizable templates and settings.

---

## 🚀 Installation & Start

This project uses [Bun](https://bun.sh/) as the runtime.
To install dependencies and start the bot, run:

```bash
bun install && bun start
```

---

## ⚙️ Environment Variables

Before starting, create a `.env` file in the project root with the following variables:

| Variable    | Description                     | Example                  |
| ----------- | ------------------------------- | ------------------------ |
| `TOKEN`     | Your Discord bot token          | `your_discord_bot_token` |
| `ROOT_LINK` | The root server link (base URL) | `http://localhost:3000`  |

Example `.env`:

```env
TOKEN=your_discord_bot_token
ROOT_LINK=http://localhost:3000
```

---

## 💬 Bot Commands

The bot supports the following commands:

| Command                 | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `!check`                | Checks if you are an admin.                                |
| `!setWelcomeChannel`    | Sets the welcome channel ID to the channel where it's run. |
| `!setActiveTemp [temp]` | Sets the active welcome template to `[temp]`.              |
| `!preview [temp]`       | Sends a preview of the given `[temp]`.                     |

> ⚠️ If `[temp]` is not defined, the bot will respond with `undefined template`.
