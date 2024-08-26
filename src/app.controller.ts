import { Controller, Get, Res } from "@nestjs/common";
import { AppService } from "./app.service";
import { lastValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import * as sharp from "sharp";
import { Response } from "express";
import { CacheKey, CacheTTL } from "@nestjs/cache-manager";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly httpService: HttpService,
  ) {}

  @CacheKey("currently_playing")
  @CacheTTL(30)
  @Get("currently-playing")
  async getCurrentlyPlaying(@Res() res: Response) {
    const data = await this.appService.getVoltFmData();
    const playing = data.now_playing_track;
    if (!playing) return null;

    const imageUrl = playing.image_url_small;
    const imageResponse = await lastValueFrom(
      this.httpService.get(imageUrl, { responseType: "arraybuffer" }),
    );
    const imageBuffer = Buffer.from(imageResponse.data, "binary");

    const base64Image = imageBuffer.toString("base64");
    const mimeType = imageResponse.headers["content-type"];

    const svgSrc = `
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 240 75" width="240" height="75">
        <rect x="0" y="0" width="100%" height="100%" rx="12" ry="12" fill="${data.theme.color_primary}" />
  
        <defs>
          <rect id="imageRect" x="15" y="15" width="45" height="45" rx="4"/>
          <clipPath id="clip">
            <use xlink:href="#imageRect"/>
          </clipPath>
        </defs>

        <image href="data:${mimeType};base64,${base64Image}" x="15" y="15" width="45" height="45" clip-path="url(#clip)"/>
 
        <g font-size="15" font-family="system-ui" font-weight="bold">
          <text x="75" y="54" fill="#090aoc">${playing.name}</text>
          <text x="75" y="32" fill="#ffffff">${playing.artists.map((x) => x.name).join(", ")}</text> 
        </g>
      </svg>`;

    const png = await sharp(Buffer.from(svgSrc)).resize(500).png().toBuffer();
    res.setHeader("Content-Type", "image/png");
    res.send(png);
  }
}
