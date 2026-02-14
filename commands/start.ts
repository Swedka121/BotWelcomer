/** @format */

import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { GLOBAL_db } from "../globals";
import { WEBHOOK_TYPE } from "../types/webhookTypeEnum";

export default {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Initialize the bot and create an admin config channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  webhook: WEBHOOK_TYPE.NO_WEBHOOK,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const { client, guildId } = interaction;

    if (!guildId)
      return interaction.reply({
        content: "This command can only be used in a server!",
        ephemeral: true,
      });
    const guild = await client.guilds.fetch(guildId as string);
    await interaction.deferReply({ ephemeral: true });

    if (!GLOBAL_db.getGuildSetting(guild.id)) {
      const overwrites = [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
      ];

      const adminRole = guild.roles.cache.find((r) =>
        r.permissions.has(PermissionFlagsBits.Administrator),
      );

      console.log(adminRole, guild.ownerId);

      if (adminRole) {
        overwrites.push({
          id: adminRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        });
      } else {
        overwrites.push({
          id: guild.ownerId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        });
      }

      const configurationChannel = await guild.channels.create({
        name: "bot-welcomer-config",
        type: ChannelType.GuildText,
        permissionOverwrites: overwrites,
      });

      const webhook = await configurationChannel.createWebhook({
        name: `${guild.name} | Configurator`,
        avatar: process.env.DEFAULT_AVATAR || "",
      });

      const webhook_id = GLOBAL_db.createWebhook(
        webhook.url,
        process.env.DEFAULT_AVATAR || "",
        `${guild.name} | Configurator`,
      );

      GLOBAL_db.createGuild(guild.id, {
        configuratorWebhookId: webhook_id,
        welcomerWebhookId: "",
      });

      const embeded = new EmbedBuilder()
        .setTitle(`🤖 Welcome to **Bot Welcomer**!`)
        .setDescription(
          `I generate custom **HTML-based animated GIFs** to greet your new members. Let's get your server configured!\n
    ⚡ Quick Setup\n
    * **Step 1:** Run \`/set-welcome-channel\` to pick a destination.\n
    * **Step 2:** Choose a template using \`/set-template\`.\n
    * **Step 3:** Ensure I have \`Attach Files\` & \`View Channel\` permissions.\n

    > **Note:** This channel is only visible to Admins.`.trim(),
        );
      const embeded2 = new EmbedBuilder().setImage(
        process.env.BOT_BANNER || "",
      );

      await webhook.send({ embeds: [embeded2, embeded] });
      await interaction.editReply(
        `Successfully initialized! Check <#${configurationChannel.id}> to finish setup.`,
      );
    } else {
      await interaction.editReply(
        "Bot is already initialized for this server!",
      );
    }
  },
};
