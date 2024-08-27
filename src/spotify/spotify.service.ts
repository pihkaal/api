import { HttpService } from "@nestjs/axios";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { EnvService } from "~/env/env.service";

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
const CACHE_LIFETIME = 30;

@Injectable()
export class SpotifyService {
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

    await this.cacheManager.set(CACHE_KEY, data, { ttl: CACHE_LIFETIME });

    return data;
  }
}
