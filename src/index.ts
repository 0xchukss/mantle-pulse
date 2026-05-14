import "dotenv/config";
import Fastify from "fastify";
import { bot } from "./bot/bot";
import { startAnomalyScanner } from "./jobs/anomalyScanner";

const app = Fastify({
  logger: true
});

app.get("/", async () => ({
  name: "MantlePulse",
  status: "live",
  commands: ["/start", "/help", "/analyze", "/whales", "/anomalies", "/pulse"]
}));

async function main() {
  if (process.env.NODE_ENV === "production") {
    await bot.init();

    app.post("/webhook", async (request, reply) => {
      try {
        await bot.handleUpdate(request.body as any);
      } catch (error) {
        console.error("Webhook update failed:", error);
      }
      return reply.send("ok");
    });

    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: "0.0.0.0" });
    if (process.env.TELEGRAM_WEBHOOK_URL) {
      await bot.api.setWebhook(`${process.env.TELEGRAM_WEBHOOK_URL.replace(/\/$/, "")}/webhook`);
    } else {
      console.warn("TELEGRAM_WEBHOOK_URL missing; webhook was not registered.");
    }
    startAnomalyScanner(bot);
    console.log("⚡ MantlePulse is live");
  } else {
    startAnomalyScanner(bot);
    await bot.start();
    console.log("⚡ MantlePulse running in polling mode");
  }
}

main().catch((error) => {
  console.error("MantlePulse failed to start:", error);
  process.exitCode = 1;
});
