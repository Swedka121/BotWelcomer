/** @format */

import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandStringOption,
  WebhookClient,
} from "discord.js";
import { GLOBAL_db, GLOBAL_frame_generator } from "../globals";
import { UndefinedTemplateError } from "../errors/UndefinedTemplateError";
import { DBQuery } from "../queries/queries";
import { WEBHOOK_TYPE } from "../types/webhookTypeEnum";
import { isGuildConfigured } from "../utils/isGuildConfigured";

export default {
  data: new SlashCommandBuilder()
    .setName("check_configuration")
    .setDescription("Check a server configration for a bot")
    .setDefaultMemberPermissions("8"),
  webhook: WEBHOOK_TYPE.CONFIGURATOR,
  execute: async (
    interaction: ChatInputCommandInteraction,
    webhook: WebhookClient,
  ) => {
    const configured = isGuildConfigured(interaction.guildId);
    const setting = GLOBAL_db.getGuildSetting(interaction.guildId as string);

    const embeded = new EmbedBuilder()
      .setTitle("⚙️ Server Configuration")
      .setDescription(
        `* **Welcome Channel:** ${setting?.welcome_channel ? `<#${setting.welcome_channel}>` : "*Not configured*"}\n
        * **Active Template:** \`${setting?.selected_template ?? "None"}\`\n\n
        * **Changelog service:** ${setting?.changelog_webhook ? "✅ Configured" : "❌ Not ready"}
        > **Status:** ${configured ? "Ready ✅" : "Incomplete ❌"}`,
      )
      .setColor(configured ? 0x2ecc71 : 0xed4245);
    await webhook.send({ embeds: [embeded] });
  },
};
