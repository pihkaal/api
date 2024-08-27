import { HttpService } from "@nestjs/axios";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import * as sharp from "sharp";

@Injectable()
export class ImageService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async fetchBase64Image(
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
