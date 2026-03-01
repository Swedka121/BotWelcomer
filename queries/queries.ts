/** @format */

import * as fs from "fs";
import * as db from "bun:sqlite";
import path from "path";
import { randomUUID } from "crypto";

interface GuildSettings {
  id: string;
  selected_template: string | undefined;
  welcome_channel: string | undefined;
  configurator_webhook: string | undefined;
  welcomer_webhook: string | undefined;
  changelog_webhook: string | undefined;
}

interface WebhookIds {
  configuratorWebhookId: string;
  welcomerWebhookId: string;
}

export class DBQuery {
  db = new db.Database(path.join(__dirname, "../", "db.sqlite"));
  constructor() {}
  private static getQueryText(queryName: string): string {
    return fs
      .readFileSync(path.join(__dirname, queryName + ".sql"))
      .toString("utf-8");
  }
  startQuery() {
    this.db.run(DBQuery.getQueryText("start"));
  }
  setWelcomeChannel(channel: string, guildId: string) {
    this.db
      .prepare(DBQuery.getQueryText("setWelcomeChannel"))
      .run(guildId, channel);
  }
  setWelcomerWebhook(webhookId: string, guildId: string) {
    this.db
      .prepare(DBQuery.getQueryText("setWelcomerWebhook"))
      .run(webhookId, guildId);
  }
  setChangelogWebhook(webhookId: string, guildId: string) {
    this.db
      .prepare(DBQuery.getQueryText("setChangelogWebhook"))
      .run(webhookId, guildId);
  }
  setActiveTemplate(template: string, guildId: string) {
    this.db
      .prepare(DBQuery.getQueryText("setActiveTemplate"))
      .run(guildId, template);
  }
  getGuildSetting(guildId: string): GuildSettings | undefined {
    return this.db
      .prepare(DBQuery.getQueryText("getGuildSettings"))
      .get(guildId) as GuildSettings | undefined;
  }
  createWebhook(
    webhook_url: string,
    avatar: string,
    username: string,
    webhook_id?: string,
  ) {
    const id = webhook_id || randomUUID();
    this.db
      .prepare(DBQuery.getQueryText("createWebhook"))
      .run(id, webhook_url, avatar, username);
    return id;
  }
  createGuild(
    guildId: string,
    { configuratorWebhookId, welcomerWebhookId }: WebhookIds,
  ) {
    return this.db
      .prepare(DBQuery.getQueryText("createGuild"))
      .run(guildId, configuratorWebhookId, welcomerWebhookId);
  }
  getWebhookUrl(webhook_id: string): string {
    return (
      this.db
        .prepare(DBQuery.getQueryText("getWebhookUrl"))
        .get(webhook_id) as { webhook_url: string }
    ).webhook_url;
  }
  getAllChangelogWebhooks(): string[] {
    return this.db
      .prepare(DBQuery.getQueryText("getAllChangelogWebhooks"))
      .all()
      .map((el: any) => el.webhook_url as string);
  }
}
