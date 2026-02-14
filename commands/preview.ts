/** @format */

import {
  ApplicationCommandPermissionType,
  ChatInputCommandInteraction,
  CommandInteraction,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  SlashCommandBuilder,
  SlashCommandStringOption,
  WebhookClient,
  type Interaction,
} from "discord.js";
import { GLOBAL_frame_generator, GLOBAL_generation_queue } from "../globals";
import * as fs from "fs";
import { getConfiguratorWebhook } from "../utils/getConfiguratorWebhook";
import { WEBHOOK_TYPE } from "../types/webhookTypeEnum";

export default {
  data: new SlashCommandBuilder()
    .setName("preview")
    .setDescription("Show preview of template")
    .setDefaultMemberPermissions("8")
    .addStringOption(
      new SlashCommandStringOption()
        .setName("template_name")
        .setDescription("The name of the template you want to preview")
        .setRequired(true),
    ),
  webhook: WEBHOOK_TYPE.CONFIGURATOR,
  execute: async (
    interaction: ChatInputCommandInteraction,
    webhook: WebhookClient,
  ) => {
    let genFin = "";

    try {
      const embeded = new EmbedBuilder()
        .setTitle("⏳ System: Queue Entry")
        .setDescription("You have been successfully added to the queue.")
        .setColor("#f1c40f");

      const waitMessage = await webhook.send({
        embeds: [embeded],
      });

      const template_name = interaction.options.getString(
        "template_name",
        true,
      );

      const generated = await GLOBAL_frame_generator.generate(template_name, {
        avatar: interaction.user.displayAvatarURL({ extension: "png" }) ?? "",
        username: interaction.user.username ?? "",
      });

      genFin = generated;

      await webhook.deleteMessage(waitMessage);
      await webhook.send({
        files: [{ attachment: generated }],
        content: `<@${interaction.member?.user.id}>`,
      });
    } catch (err) {
      console.log(err);
    } finally {
      fs.unlinkSync(genFin);
    }
  },
};
