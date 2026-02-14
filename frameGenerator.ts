/** @format */

import * as fs from "fs";
import * as path from "path";
import * as gif from "gifencoder";
import { UndefinedTemplateError } from "./errors/UndefinedTemplateError";
import { TemplateMisconfiguredError } from "./errors/TemplateMisconfiguredError";
import puppeteer, { Browser, Page, Puppeteer } from "puppeteer";
import { FrameGeneratorIsNotReady } from "./errors/FrameGenaretorIsNotReady";
import { ActiveTemplateIsUndefined } from "./errors/ActiveTemplateIsUndefined";
import { randomUUID } from "crypto";
import { GLOBAL_generation_queue } from "./globals";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { Readable } from "stream";

class FrameGeneratorStream extends Readable {
  page: Page;
  delay: number;
  frames: number;
  count: number = 0;
  constructor(page: Page, delay: number, frames: number) {
    super();

    this.page = page;
    this.delay = delay;
    this.frames = frames;
  }
  override async _read() {
    if (this.count < this.frames) {
      await new Promise(async (res, rej) => {
        setTimeout(res, this.delay);
      });
      const buffer = await this.page.screenshot({
        fullPage: true,
        type: "png",
      });

      this.push(buffer);
    } else {
      this.push(null);
    }

    this.count++;
  }
}

class Template {
  name: string;
  html: string;
  sizes: {
    width: number;
    height: number;
  };
  animated: boolean;
  time: number;
  fps: number;

  constructor({
    name,
    html,
    sizes,
    animated,
    time,
    fps,
  }: {
    name: string;
    html: string;
    sizes: { width: number; height: number };
    animated: boolean;
    time: number;
    fps: number;
  }) {
    if (
      !name ||
      !html ||
      !sizes.width ||
      !sizes.height ||
      typeof animated !== "boolean" ||
      !time ||
      !fps
    )
      throw new TemplateMisconfiguredError();
    this.name = name;
    this.html = fs
      .readFileSync(path.join(__dirname, "htmls", html + ".html"))
      .toString("utf-8");
    this.sizes = sizes;
    this.animated = animated;
    this.fps = fps;
    this.time = time;
  }
}

interface GeneratorContext {
  username: string;
  avatar: string;
}

export class FrameGenerator {
  initializated: boolean = false;
  browser: Browser | null = null;
  activeTemplate: Template | null = null;
  queue: { temp: Template; context: GeneratorContext }[] = [];
  constructor() {}

  async initializate() {
    const isArm = process.arch === "arm64";

    const executablePath = isArm ? "/usr/bin/chromium-browser" : undefined; // undefined tells Puppeteer to use its own bundled Chrome

    this.browser = await puppeteer.launch({
      executablePath: executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    ffmpeg.setFfmpegPath(ffmpegPath as string);

    try {
      await new Promise((res, rej) => {
        ffmpeg.getAvailableCodecs((err) => {
          if (err) rej(err);
          res("Okay!");
        });
      });

      console.log("FFmpeg successfuly initilized!");
    } catch (err) {
      console.log("FFmpeg is not initilized, are you sure you install ffmpeg?");
      throw err;
    }

    this.initializated = true;
  }
  async generate(name: string | undefined, context: GeneratorContext) {
    if (!this.initializated) throw new FrameGeneratorIsNotReady();
    const template = this.getTemplate(name);

    return (await GLOBAL_generation_queue.push(async () => {
      this.activeTemplate = template;

      if (template.animated) return await this.generateAnimated(context);
      else return await this.generateNonAnimated(context);
    })) as string;
  }
  private generateFrame(page: Page, wait: number, genId: string) {
    return async () => {
      await Bun.sleep(wait);
    };
  }

  private async generateAnimated(context: GeneratorContext) {
    if (!this.activeTemplate) throw new ActiveTemplateIsUndefined();
    const { fps, time, html, sizes } = this.activeTemplate;
    const { username, avatar } = context;
    const browser = this.browser as Browser;
    const delay = Math.floor((1 / fps) * 100);
    let framesCount = time * fps;

    let template = html;

    template = template.replace("_-_avatar_-_", avatar || "http://example.com");
    template = template.replace("_-_username_-_", username);
    template = template.replace("_-_root_link_-_", process.env.ROOT_LINK || "");

    const page = await browser.newPage();

    await page.setViewport({
      width: sizes.width,
      height: sizes.height,
    });
    await page.setContent(template);

    const waitTimeStart = new Date();

    //@ts-ignore
    await page.evaluate(() => document.fonts.ready);

    if (html.includes("<video/>"))
      await page.waitForFunction(() => {
        //@ts-ignore
        const video = document.getElementById("wait");
        return video && video.readyState >= 4;
      });

    const waitTime = Date.now() - waitTimeStart.getTime();

    console.log("Waiting for load: ", new Date(waitTime));

    const stream = new FrameGeneratorStream(page, delay, framesCount);

    const outputPath = path.join(
      __dirname,
      "frames",
      "toSend-" + randomUUID() + ".webp",
    );

    return await new Promise((res, rej) => {
      ffmpeg(stream)
        .inputFormat("image2pipe")
        .inputFPS(fps)
        .videoCodec("libwebp")
        .outputOptions([
          "-lossless 0",
          "-compression_level 6",
          "-q:v 75",
          "-loop 0",
        ])
        .noAudio()
        .format("webp")
        .on("start", (cmd) => console.log("Started FFmpeg: " + cmd))
        .on("error", (err) => (rej(err), page.close()))
        .on("end", () => {
          (console.log("WebP animation finished!"),
            page.close(),
            res(outputPath));
        })
        .save(outputPath);
    });
  }
  private async generateNonAnimated(context: GeneratorContext) {
    if (!this.activeTemplate) throw new ActiveTemplateIsUndefined();
    const { html, sizes } = this.activeTemplate;
    const { username, avatar } = context;
    const browser = this.browser as Browser;

    let template = html;

    template = template.replace("_-_avatar_-_", avatar || "http://example.com");
    template = template.replace("_-_username_-_", username);
    template = template.replace("_-_root_link_-_", process.env.ROOT_LINK || "");

    const page = await browser.newPage();

    await page.setViewport({
      width: sizes.width,
      height: sizes.height,
    });
    await page.setContent(template);

    //@ts-ignore
    await page.evaluate(() => document.fonts.ready);

    const genId = randomUUID();
    await this.generateFrame(page, 0, genId)();

    page.close();

    return path.join(__dirname, "frames", `frame-0-${genId}.png`);
  }
  private getTemplate(name: string | undefined): Template {
    if (typeof name !== "string") throw new UndefinedTemplateError();

    const pathToTemplate = path.join(__dirname, "templates", name + ".json");

    if (!fs.existsSync(pathToTemplate)) throw new UndefinedTemplateError();
    const fileData = fs.readFileSync(pathToTemplate).toString("utf-8");
    if (!fileData) throw new UndefinedTemplateError();

    return new Template(JSON.parse(fileData));
  }
  isTemplateExists(name: string) {
    const pathToTemplate = path.join(__dirname, "templates", name + ".json");

    return fs.existsSync(pathToTemplate);
  }
}
