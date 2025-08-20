console.log("Hello via Bun!");

import express from "express";
import { config } from "dotenv";
import * as generator from "puppeteer";
import * as gif from "gifencoder";
import { Client, TextChannel } from "discord.js";
import fs from "fs";
import bun from "bun";
import pngFileStream from "png-file-stream";
import type Stream from "stream";

config();

const app = express();

app.get("/", (req, res, next) => {
  res.json({ message: "pong" }).status(200);
});

app.use("/public", express.static("./resources"));
app.listen(3000);

type saving_data_type = {
  hello_channel: string | null;
  active_temp: string | null;
};

type template_type = {
  name: string;
  html: string;
  sizes: {
    width: number;
    height: number;
  };
  animated: boolean;
  time: number;
  fps: number;
};

const discordBot = new Client({
  intents: [
    "Guilds",
    "GuildMembers",
    "GuildMessages",
    "GuildInvites",
    "GuildWebhooks",
    "MessageContent",
  ],
});

if (!fs.existsSync("./saving.json"))
  fs.appendFileSync("./saving.json", JSON.stringify({ hello_channel: "" }));

if (!fs.existsSync("./frames")) fs.mkdirSync("./frames");

function changeSavings(
  callback: (oldObj: saving_data_type) => saving_data_type
) {
  const oldFile = getSavings();
  const newObj = callback(oldFile);
  fs.writeFileSync("./saving.json", JSON.stringify(newObj));
}

function getSavings() {
  return JSON.parse(
    fs.readFileSync("./saving.json").toString()
  ) as saving_data_type;
}

function getHtml(name: string): string {
  if (!fs.existsSync(`./htmls/${name}.html`)) return getHtml("undefined");
  return fs.readFileSync(`./htmls/${name}.html`).toString();
}

function getTemplate(name: string): template_type {
  if (!fs.existsSync(`./templates/${name}.json`))
    return {
      name: "undefined",
      html: getHtml("undefined"),
      sizes: {
        width: 200,
        height: 200,
      },
      animated: false,
      time: 1,
      fps: 1,
    };

  const temp = JSON.parse(
    fs.readFileSync(`./templates/${name}.json`).toString()
  ) as template_type;

  const full_temp: template_type = {
    name: temp.name || "undefined",
    html: getHtml(temp.html || "undefined"),
    animated: temp.animated || false,
    sizes: {
      width: temp.sizes.width || 200,
      height: temp.sizes.height || 200,
    },
    fps: temp.fps || 1,
    time: temp.time || 1,
  };

  return full_temp;
}

async function generateTemplate(
  temp: template_type,
  avatar: string,
  username: string
): Promise<Stream | string> {
  if (temp.animated) {
    const browser = await generator.launch();
    const time = temp.time;
    const fps = temp.fps;
    const delay = (1 / fps) * 100;

    let framesCount = time * fps;

    let template = temp.html;

    template = template.replace("_-_avatar_-_", avatar || "http://example.com");
    template = template.replace("_-_username_-_", username);
    template = template.replace("_-_root_link_-_", process.env.ROOT_LINK || "");
    const page = await browser.newPage();

    await page.setViewport({
      width: temp.sizes.width,
      height: temp.sizes.height,
    });
    await page.setContent(template);

    //@ts-ignore
    await page.evaluate(() => document.fonts.ready);

    // 3. Wait for video to be ready to play
    await page.waitForFunction(() => {
      //@ts-ignore

      const video = document.getElementById("wait");
      return video && video.readyState >= 4; // HAVE_ENOUGH_DATA
    });

    let promises = [];
    let paths = [];
    for (let x = 0; x < framesCount; x++) {
      promises.push(generateFrame(page, x, delay, username)());
      paths.push(`./frames/frame-${x}-${username}.png`);
    }

    await Promise.all(promises);

    let encoder = new gif.default(temp.sizes.width, temp.sizes.height);
    const stream = pngFileStream(paths)
      .pipe(encoder.createWriteStream({ repeat: 0, delay, quality: 2 }))
      .pipe(fs.createWriteStream(`./${username}-toSend.gif`));

    stream.on("finish", () => {
      paths.forEach((el) => fs.unlinkSync(el));
    });

    await browser.close();

    return stream as Stream;
  } else {
    const browser = await generator.launch();
    let template = temp.html;

    template = template.replace("_-_avatar_-_", avatar || "http://example.com");
    template = template.replace("_-_username_-_", username);
    template = template.replace("_-_root_link_-_", process.env.ROOT_LINK || "");
    const page = await browser.newPage();

    await page.setContent(template);
    await page.setViewport({
      width: temp.sizes.width,
      height: temp.sizes.height,
    });

    //@ts-ignore
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => {
      //@ts-ignore

      const video = document.getElementById("wait");
      return video && video.complete && video.naturalWidth > 0;
    });

    await page.screenshot({ fullPage: true, path: `./${username}-toSend.png` });

    return `./${username}-toSend.png`;
  }
}

function generateFrame(
  page: generator.Page,
  frameNum: number,
  delay: number,
  id: string
): () => Promise<void> {
  return async () => {
    await bun.sleep(delay * frameNum);
    await page.screenshot({
      path: `./frames/frame-${frameNum}-${id}.png`,
      fullPage: true,
    });
  };
}

discordBot.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  console.log("I have message! " + message.content + " !");

  const user = message.mentions.members?.first() || message.member;

  if (!user) return;

  let isAdmin = false;
  user.roles.cache.forEach((role) => {
    if (role.permissions.has("Administrator")) isAdmin = true;
    console.log(role.name);
  });

  if (!isAdmin) return;

  const params = message.content.split(" ");

  switch (message.content.split(" ")[0]) {
    case "!check": {
      await message.channel.send("Admin is here! Stand up!");
      break;
    }
    case "!setWelcomeChannel": {
      changeSavings((old) => ({ ...old, hello_channel: message.channelId }));

      await message.channel.send(
        `Channel ${message.channelId} is setted as welcome channel!`
      );
      break;
    }
    case "!setActiveTemp": {
      if (!params[1]) return;
      changeSavings((old) => ({ ...old, active_temp: params[1] as string }));

      await message.channel.send(`${params[1]} is now active!`);
      break;
    }
    case "!preview": {
      const template = getTemplate(params[1] || "undefined");
      const toSend = await generateTemplate(
        template,
        message.author.avatarURL() as string,
        message.author.username
      );

      if (typeof toSend !== "string") {
        toSend.on("finish", async () => {
          await message.channel.send({
            files: [{ attachment: `./${message.author.username}-toSend.gif` }],
            content: `||<@${message.author.id}>||`,
          });
          fs.unlinkSync(`./${message.author.username}-toSend.gif`);
        });
      } else {
        await message.channel.send({
          files: [{ attachment: `./${message.author.username}-toSend.png` }],
          content: `||<@${message.author.id}>||`,
        });
        fs.unlinkSync(`./${message.author.username}-toSend.png`);
      }
    }
  }
});

discordBot.on("guildMemberAdd", async (member) => {
  if (!getSavings().hello_channel) return;
  const channel = discordBot.channels.cache.get(
    getSavings().hello_channel as string
  ) as TextChannel;

  if (!getSavings().active_temp) return;
  const template = getTemplate(getSavings().active_temp as string);

  const toSend = await generateTemplate(
    template,
    member.user.avatarURL() as string,
    member.user.username
  );

  if (typeof toSend !== "string") {
    toSend.on("finish", async () => {
      await channel.send({
        files: [{ attachment: `./${member.user.username}-toSend.gif` }],
        content: `||<@${member.user.id}>||`,
      });
      fs.unlinkSync(`./${member.user.username}-toSend.gif`);
    });
  } else {
    await channel.send({
      files: [{ attachment: `./${member.user.username}-toSend.png` }],
      content: `||<@${member.user.id}>||`,
    });
    fs.unlinkSync(`./${member.user.username}-toSend.png`);
  }
});

discordBot.login(process.env.BOT_TOKEN);
