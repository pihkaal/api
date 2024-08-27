import { Inject, Injectable } from "@nestjs/common";
import { EnvService } from "./env/env.service";
import { lastValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import * as sharp from "sharp";

type VoltFmData = {
  now_playing_track?: {
    id: string;
    name: string;
    image_url_large: string;
    image_url_small: string;
    artists: Array<{ id: string; name: string }>;
    duration_ms: number;
    preview_url: string;
  };
  theme: {
    id: string;
    color_primary: string;
  };
};

const CACHE_KEY = "voltfm_data";
const CACHE_LIFETIME = 30 * 1000;

@Injectable()
export class AppService {
  constructor(
    private readonly envService: EnvService,
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getVoltFmData(): Promise<VoltFmData> {
    const cached = await this.cacheManager.get<VoltFmData>(CACHE_KEY);
    if (cached) return cached;

    const voltHtml = await lastValueFrom(
      this.httpService.get<string>(
        `https://volt.fm/${this.envService.get("VOLTFM_USERNAME")}`,
      ),
    );

    const rawData = voltHtml.data.match(
      /<script id="state" type="application\/json">([\s\S]*?)<\/script>/,
    );
    const data = JSON.parse(rawData[1]) as VoltFmData;

    await this.cacheManager.set(CACHE_KEY, data, CACHE_LIFETIME);

    return data;
  }

  async fetchImage(
    url: string,
    resize?: { width: number; height: number },
  ): Promise<string> {
    let cacheKey = url;
    if (resize) {
      cacheKey += `@${resize.width}x${resize.height}`;
    }

    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) return cached;

    const imageResponse = await lastValueFrom(
      this.httpService.get(url, { responseType: "arraybuffer" }),
    );
    let imageBuffer = Buffer.from(imageResponse.data, "binary");

    if (resize) {
      imageBuffer = await sharp(imageBuffer)
        .resize(resize.width, resize.height)
        .toBuffer();
    }

    const base64Image = imageBuffer.toString("base64");
    const mimeType = imageResponse.headers["content-type"];

    const data = `data:${mimeType};base64,${base64Image}`;

    await this.cacheManager.set(cacheKey, data);

    return data;
  }
}
