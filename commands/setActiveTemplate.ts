/** @format */

import {
  ChannelType,
  ChatInputCommandInteraction,
  Embed,
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandStringOption,
  WebhookClient,
} from "discord.js";
import { GLOBAL_db, GLOBAL_frame_generator } from "../globals";
import { UndefinedTemplateError } from "../errors/UndefinedTemplateError";
import { getConfiguratorWebhook } from "../utils/getConfiguratorWebhook";
import { WEBHOOK_TYPE } from "../types/webhookTypeEnum";

export default {
  data: new SlashCommandBuilder()
    .setName("set_active_template")
    .setDescription("Sets active template for bot")
    .setDefaultMemberPermissions("8")
    .addStringOption(
      new SlashCommandStringOption()
        .setName("template_name")
        .setDescription("The name of the template you want to set")
        .setRequired(true),
    ),
  webhook: WEBHOOK_TYPE.CONFIGURATOR,
  execute: async (
    interaction: ChatInputCommandInteraction,
    webhook: WebhookClient,
  ) => {
    if (
      !GLOBAL_frame_generator.isTemplateExists(
        interaction.options.get("template_name")?.value as string,
      )
    )
      throw new UndefinedTemplateError();

    GLOBAL_db.setActiveTemplate(
      interaction.options.get("template_name")?.value as string,
      interaction.guildId as string,
    );
    const embeded = new EmbedBuilder()
      .setTitle("✅ Active Template Updated")
      .setDescription(
        `Active template is now set to: **${interaction.options.getString("template_name")}**`,
      )
      .setColor(0x2ecc71);
    await webhook.send({ embeds: [embeded] });
  },
};
