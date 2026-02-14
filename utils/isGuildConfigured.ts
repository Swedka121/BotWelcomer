/** @format */

import { GLOBAL_db } from "../globals";

export function isGuildConfigured(guildId: string | null) {
  const setting = GLOBAL_db.getGuildSetting(guildId as string);
  return (
    setting &&
    typeof setting.selected_template === "string" &&
    typeof setting.welcome_channel === "string"
  );
}
