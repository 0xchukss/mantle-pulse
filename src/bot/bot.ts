import "dotenv/config";
import { Bot } from "grammy";
import { analyzeCommand } from "./commands/analyze";
import { anomaliesCommand } from "./commands/anomalies";
import { helpCommand } from "./commands/help";
import { pulseCommand } from "./commands/pulse";
import { startCommand } from "./commands/start";
import { whalesCommand } from "./commands/whales";
import { naturalLanguageHandler } from "./handlers/naturalLanguage";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

bot.catch((error) => {
  console.error("Telegram bot error:", error);
});

bot.command("start", startCommand);
bot.command("help", helpCommand);
bot.command("analyze", analyzeCommand);
bot.command("whales", whalesCommand);
bot.command("anomalies", anomaliesCommand);
bot.command("pulse", pulseCommand);
bot.on("message:text", naturalLanguageHandler);
