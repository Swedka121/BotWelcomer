/** @format */

import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandChannelOption,
  TextChannel,
  WebhookClient,
  type GuildTextBasedChannel,
} from "discord.js";
import { GLOBAL_db } from "../globals";
import { WEBHOOK_TYPE } from "../types/webhookTypeEnum";

export default {
  data: new SlashCommandBuilder()
    .setName("set_welcome_channel")
    .setDescription("Sets welcome channel for bot")
    .setDefaultMemberPermissions("8")
    .addChannelOption(
      new SlashCommandChannelOption()
        .setName("channel")
        .setDescription("Welcome channel")
        .addChannelTypes([ChannelType.GuildText])
        .setRequired(true),
    ),
  webhook: WEBHOOK_TYPE.CONFIGURATOR,
  execute: async (
    interaction: ChatInputCommandInteraction,
    webhook: WebhookClient,
  ) => {
    const webhook_id_prev = GLOBAL_db.getGuildSetting(
      interaction.guildId || "",
    );

    GLOBAL_db.setWelcomeChannel(
      interaction.options.get("channel")?.channel?.id as string,
      interaction.guildId as string,
    );

    const channel = (await interaction.guild?.channels.fetch(
      interaction.options.getChannel("channel")?.id as string,
    )) as TextChannel;

    const welcomer_webhook = await channel.createWebhook({
      avatar: process.env.DEFAULT_AVATAR || "",
      name: interaction.guild?.name + " | Welcomer",
    });

    const webhook_id = GLOBAL_db.createWebhook(
      welcomer_webhook.url,
      process.env.DEFAULT_AVATAR || "",
      welcomer_webhook.name,
      webhook_id_prev?.welcomer_webhook,
    );

    console.log(webhook_id);

    GLOBAL_db.setWelcomerWebhook(webhook_id, interaction.guildId as string);

    const embeded = new EmbedBuilder()
      .setTitle("✅ Welcome Channel Updated")
      .setDescription(
        `New members will now be greeted in <#${interaction.options.getChannel("channel")?.id}>.`,
      )
      .setColor(0x2ecc71);
    await webhook.send({ embeds: [embeded] });
  },
};
