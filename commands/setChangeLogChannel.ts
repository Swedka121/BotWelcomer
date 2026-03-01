/** @format */

import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandChannelOption,
  TextChannel,
  WebhookClient,
} from "discord.js";
import { GLOBAL_db } from "../globals";
import { WEBHOOK_TYPE } from "../types/webhookTypeEnum";

export default {
  data: new SlashCommandBuilder()
    .setName("set_change_log")
    .setDescription("Sets changelog channel")
    .setDefaultMemberPermissions("8")
    .addChannelOption(
      new SlashCommandChannelOption()
        .setName("channel")
        .setDescription("Changelog channel")
        .addChannelTypes([ChannelType.GuildText])
        .setRequired(true),
    ),
  webhook: WEBHOOK_TYPE.CONFIGURATOR,
  execute: async (
    interaction: ChatInputCommandInteraction,
    webhook: WebhookClient,
  ) => {
    const channel = interaction.options.getChannel("channel") as TextChannel;
    const guildId = interaction.guildId as string;

    const changelog_webhook = await channel.createWebhook({
      avatar: process.env.DEFAULT_AVATAR || "",
      name: interaction.guild?.name + " | Changelog",
    });

    const webhook_id = GLOBAL_db.createWebhook(
      changelog_webhook.url,
      process.env.DEFAULT_AVATAR || "",
      changelog_webhook.name,
    );

    GLOBAL_db.setChangelogWebhook(webhook_id, guildId);

    const embeded = new EmbedBuilder()
      .setTitle("✅ Changelog Channel Updated")
      .setDescription(`Changelog now will be published in <#${channel.id}>.`)
      .setColor(0x2ecc71);

    await webhook.send({ embeds: [embeded] });
  },
};
