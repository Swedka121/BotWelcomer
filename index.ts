/** @format */

console.log("Hello via Bun!");

import express from "express";
import { config } from "dotenv";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  AttachmentBuilder,
  ChannelType,
  Client,
  Collection,
  Embed,
  EmbedBuilder,
  EntryPointCommandHandlerType,
  Events,
  GatewayIntentBits,
  Guild,
  GuildInviteManager,
  GuildMember,
  GuildMessageManager,
  MessageFlags,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  TextChannel,
  WebhookClient,
  type Interaction,
} from "discord.js";
import fs from "fs";
import { FrameGenerator } from "./frameGenerator";
import path from "path";
import { GLOBAL_commands, GLOBAL_db, GLOBAL_frame_generator } from "./globals";
import "./deployCommands";
import * as db from "bun:sqlite";
import { WEBHOOK_TYPE } from "./types/webhookTypeEnum";
import { getConfiguratorWebhook } from "./utils/getConfiguratorWebhook";
import { getWelcomerWebhook } from "./utils/getWelcomerWebhook";
import { error } from "console";
config();

const app = express();

app.get("/", (req, res, next) => {
  res.json({ message: "pong" }).status(200);
});
app.use("/public", express.static("./resources"));
app.listen(3000);

if (!fs.existsSync("./frames")) fs.mkdirSync("./frames");

const client = new Client({
  intents: [
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.Guilds,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = GLOBAL_commands.get(interaction.commandName) as {
    data: SlashCommandBuilder;
    webhook: WEBHOOK_TYPE;
    execute: (
      interaction: Interaction,
      webhook: WebhookClient | undefined,
    ) => Promise<void>;
  };

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  let webhook;
  switch (command.webhook) {
    case WEBHOOK_TYPE.CONFIGURATOR: {
      webhook = getConfiguratorWebhook(interaction.guildId);
      break;
    }
    case WEBHOOK_TYPE.WELCOMER: {
      webhook = getWelcomerWebhook(interaction.guildId);
      break;
    }
  }

  try {
    if (webhook) {
      await interaction.deferReply();
      await interaction.deleteReply();

      const webhookData = await client.fetchWebhook(webhook.id);
      if (webhookData.channelId !== interaction.channelId)
        throw new Error(
          "You are not allowed to use this command in this chat!",
        );
    }
    await command.execute(interaction, webhook);
  } catch (error) {
    console.error(error);
    if (webhook) {
      const embeded = new EmbedBuilder()
        .setTitle("❌ Command Execution Error")
        .setDescription(
          "An unexpected error occurred while processing your request.",
        )
        .addFields({
          name: "Error Message",
          value: `\`\`\`fix\n${(error as Error).message}\n\`\`\``,
        })
        .setColor(0xed4245)
        .setFooter({ text: "Please report this if it persists" });
      await webhook.send({ embeds: [embeded] });
      return;
      2;
    }
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  const setting = GLOBAL_db.getGuildSetting(member.guild.id);
  const generated = await GLOBAL_frame_generator.generate(
    setting?.selected_template,
    {
      avatar: member.displayAvatarURL() as string,
      username: member.displayName,
    },
  );

  try {
    const webhook = getWelcomerWebhook(member.guild.id);

    const attachment = new AttachmentBuilder(generated, {
      name: `attchment1.${generated.split(".")[1]}`,
    });

    const embeded = new EmbedBuilder()
      .setImage(`attachment://attchment1.${generated.split(".")[1]}`)
      .setColor(member.displayColor);

    await webhook.send({ embeds: [embeded], files: [attachment] });
    const message = await webhook.send({ content: `<@${member.id}>` });
    await webhook.deleteMessage(message);
  } catch (err) {
    const webhook = getConfiguratorWebhook(member.guild.id);
    const embeded = new EmbedBuilder()
      .setTitle("❌ Command Execution Error")
      .setDescription(
        "An unexpected error occurred while processing greeting event.",
      )
      .addFields({
        name: "Error Message",
        value: `\`\`\`fix\n${(err as Error).message}\n\`\`\``,
      })
      .setColor(0xed4245)
      .setFooter({ text: "Please report this if it persists" });
    await webhook.send({ embeds: [embeded] });
  } finally {
    fs.unlinkSync(generated);
  }
});

client.login(process.env.BOT_TOKEN);
