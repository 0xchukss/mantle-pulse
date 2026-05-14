import type { Context } from "grammy";
import { helpText } from "./help";

export async function startCommand(ctx: Context): Promise<void> {
  await ctx.reply(helpText);
}
