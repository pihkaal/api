import { Controller, Get, Header } from "@nestjs/common";
import { AppService } from "./app.service";
import { lastValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { CacheKey, CacheTTL } from "@nestjs/cache-manager";
import { createCanvas } from "canvas";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly httpService: HttpService,
  ) {}

  @Get("currently-playing")
  @CacheKey("currently_playing")
  @CacheTTL(30)
  @Header("Content-Type", "image/svg+xml")
  async getCurrentlyPlaying(): Promise<string> {
    const data = await this.appService.getVoltFmData();
    const playing = data.now_playing_track;
    if (!playing) return "not listening";

    const imageUrl = playing.image_url_small;
    const imageResponse = await lastValueFrom(
      this.httpService.get(imageUrl, { responseType: "arraybuffer" }),
    );
    const imageBuffer = Buffer.from(imageResponse.data, "binary");

    const base64Image = imageBuffer.toString("base64");
    const mimeType = imageResponse.headers["content-type"];

    const htmlEncode = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    // mesure size
    const canvas = createCanvas(1024, 50);
    const ctx = canvas.getContext("2d");

    ctx.font = "15px system-ui";

    const title = playing.name;
    const artists = playing.artists.map((x) => x.name).join(" / ");

    const titleWidth = ctx.measureText(title).width;
    const barsX = 15 + 45 + 15 + titleWidth + 20;

    const maxWidth = Math.min(
      240,
      Math.max(
        15 + 45 + 15 + titleWidth + 20 + 20,
        ctx.measureText(artists).width,
      ),
    );
    const width = 15 + 45 + 15 + maxWidth + 20;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} 75" width="${width}" height="75">
        <rect x="0" y="0" width="100%" height="100%" rx="12" ry="12" fill="${data.theme.color_primary}" />
  
        <g transform="translate(${barsX}, 32) rotate(180)">
          <rect
            x="0"
            y="0"
            width="5"
            height="3"
            fill="#ffffff"
            opacity="1"
          >
            <animate
              attributeName="height"
              values="3; 15; 3"
              dur="900ms"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.7; 1; 0.7"
              dur="900ms"
              repeatCount="indefinite"
            />
          </rect>
          <rect
            x="-7"
            y="0"
            width="5"
            height="3"
            fill="#ffffff"
            opacity="1"
          >
            <animate
              attributeName="height"
              values="3; 15; 3"
              dur="900ms"
              begin="120ms"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.7; 1; 0.7"
              dur="900ms"        
              begin="120ms"
              repeatCount="indefinite"
            />
          </rect>

          <rect
            x="-14"
            y="0"
            width="5"
            height="3"
            fill="#ffffff"
            opacity="1"
          >
            <animate
              delay="240ms"
              attributeName="height"
              values="3; 15; 3"
              dur="900ms"        
              begin="310ms"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.7; 1; 0.7"
              dur="900ms"        
              begin="310ms"
              repeatCount="indefinite"
            />
          </rect>
        </g>

        <defs>
          <rect id="imageRect" x="15" y="15" width="45" height="45" rx="4"/>
          <clipPath id="clip">
            <use xlink:href="#imageRect"/>
          </clipPath>
        </defs>

        <image href="data:${mimeType};base64,${base64Image}" x="15" y="15" width="45" height="45" clip-path="url(#clip)"/>
 
        <g font-size="15" font-family="system-ui" font-weight="bold">
          <text x="75" y="32" fill="#ffffff">${htmlEncode(title)}</text> 
          <text x="75" y="54" fill="#090aoc">${htmlEncode(artists)}</text>
        </g>
      </svg>`.replaceAll(" ", "");
  }
}
