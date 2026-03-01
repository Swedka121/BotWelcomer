/** @format */

import { Collection } from "discord.js";
import { FrameGenerator } from "./frameGenerator";
import { AsyncQueue } from "./utils/AsyncQueue";
import { DBQuery } from "./queries/queries";
import { ChangelogService } from "./changeLogGenerator";

const GLOBAL_frame_generator = new FrameGenerator();
await GLOBAL_frame_generator.initializate();
export { GLOBAL_frame_generator };

const GLOBAL_commands = new Collection();
export { GLOBAL_commands };

const GLOBAL_generation_queue = new AsyncQueue();
export { GLOBAL_generation_queue };

const GLOBAL_db = new DBQuery();
GLOBAL_db.startQuery();
export { GLOBAL_db };

export const GLOBAL_changelog_generator = new ChangelogService({
  owner: process.env.REPO_OWNER as string,
  repo: process.env.REPO_NAME as string,
  geminiApiKey: process.env.GEMINI_TOKEN as string,
});
