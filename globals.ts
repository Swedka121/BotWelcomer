/** @format */

import { Collection } from "discord.js";
import { FrameGenerator } from "./frameGenerator";
import { AsyncQueue } from "./utils/AsyncQueue";
import { DBQuery } from "./queries/queries";

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
