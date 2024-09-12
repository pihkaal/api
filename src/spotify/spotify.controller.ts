import { Controller, Get, HttpStatus, Query, Res } from "@nestjs/common";
import { SpotifyService } from "./spotify.service";
import { ImageService } from "~/image/image.service";
import { createCanvas } from "canvas";
import { Response } from "express";

const IMAGE_SIZE = 128;

@Controller()
export class SpotifyController {
  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly imageService: ImageService,
  ) {}

  @Get("currently-playing")
  async getCurrentlyPlaying(
    @Query() query: { format: string },
    @Res() res: Response,
  ): Promise<void> {
    const playing = await this.spotifyService.getCurrentlyPlaying();
    if (!playing.is_playing || !playing.item) {
      res.send({ is_playing: false });
      return;
    }

    query.format ??= "json";

    if (query.format === "json") {
      res.send(playing);
      return;
    } else if (query.format === "svg") {
      const images = playing.item.album.images;

      const image = await this.imageService.fetchBase64Image(
        images[images.length >= 2 ? images.length - 2 : images.length - 1].url,
        {
          width: IMAGE_SIZE,
          height: IMAGE_SIZE,
        },
      );

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

      ctx.font = "bold 15px system-ui";

      const title = playing.item.name;
      const artists = playing.item.artists.map((x) => x.name).join(" / ");

      const titleWidth = ctx.measureText(title).width;
      const barsX = 15 + 45 + 15 + titleWidth + 15;

      const maxWidth = Math.max(
        titleWidth + 15 + 20,
        ctx.measureText(artists).width,
      );
      const width = Math.max(250, 15 + 45 + 15 + maxWidth + 15);

      res.setHeader("Content-Type", "image/svg+xml").send(`
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} 75" width="${width}" height="75">
        <rect x="0" y="0" width="100%" height="100%" rx="12" ry="12" fill="#1ed760" />
  
        <g transform="translate(${barsX}, 32) rotate(180)">
          <rect
            x="0"
            y="0"
            width="4"
            height="3"
            fill="#ffffff"
            opacity="1"
          >
            <animate
              attributeName="height"
              values="3; 12; 3"
              dur="800ms"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.7; 1; 0.7"
              dur="800ms"
              repeatCount="indefinite"
            />
          </rect>
          <rect
            x="-6"
            y="0"
            width="4"
            height="3"
            fill="#ffffff"
            opacity="1"
          >
            <animate
              attributeName="height"
              values="3; 12; 3"
              dur="800ms"
              begin="120ms"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.7; 1; 0.7"
              dur="800ms"        
              begin="120ms"
              repeatCount="indefinite"
            />
          </rect>

          <rect
            x="-12"
            y="0"
            width="4"
            height="3"
            fill="#ffffff"
            opacity="1"
          >
            <animate
              delay="240ms"
              attributeName="height"
              values="3; 12; 3"
              dur="800ms"        
              begin="310ms"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.7; 1; 0.7"
              dur="800ms"        
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

        <image href="${image}" x="15" y="15" width="45" height="45" clip-path="url(#clip)"/>
 
        <g font-size="15" font-family="system-ui" font-weight="bold">
          <text x="75" y="32" fill="#ffffff">${htmlEncode(title)}</text> 
          <text x="75" y="54" fill="#090aoc">${htmlEncode(artists)}</text>
        </g>
      </svg>`);
      return;
    }

    res.sendStatus(HttpStatus.BAD_REQUEST);
  }
}
