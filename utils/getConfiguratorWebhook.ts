/** @format */

import { parseWebhookURL, Webhook, WebhookClient } from "discord.js";
import { GLOBAL_db } from "../globals";

export function getConfiguratorWebhook(guildId: string | null) {
  if (!guildId) throw new Error("You need to use this bot in channel!");
  const guild = GLOBAL_db.getGuildSetting(guildId);
  const webhook = GLOBAL_db.getWebhookUrl(guild?.configurator_webhook || "");
  return new WebhookClient({ url: webhook });
}
