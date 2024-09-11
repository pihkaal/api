import { HttpService } from "@nestjs/axios";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { EnvService } from "~/env/env.service";

type CurrentlyPlaying = {
  item: {
    id: string;
    name: string;
    artists: Array<{ id: string; name: string }>;
    duration_ms: number;
    preview_url: string;
    album: {
      images: Array<{ url: string }>;
    };
  };
  preview_url: string;
  progress_ms: number;
  is_playing: boolean;
};

const CACHE_KEY = "currently_playing";
const CACHE_LIFETIME = 30;

@Injectable()
export class SpotifyService {
  constructor(
    private readonly envService: EnvService,
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async refreshAccessToken() {
    const { data } = await lastValueFrom(
      this.httpService.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.envService.get("SPOTIFY_REFRESH_TOKEN"),
        }),
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.envService.get("SPOTIFY_CLIENT_ID")}:${this.envService.get("SPOTIFY_CLIENT_SECRET")}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      ),
    );

    await this.cacheManager.set("spotify_access_token", data.access_token, {
      ttl: data.expires_in,
    });
  }

  async getCurrentlyPlaying(): Promise<CurrentlyPlaying> {
    const cached = await this.cacheManager.get<CurrentlyPlaying>(CACHE_KEY);
    if (cached) return cached;

    try {
      const { data } = await lastValueFrom(
        this.httpService.get<CurrentlyPlaying>(
          "https://api.spotify.com/v1/me/player/currently-playing",
          {
            headers: {
              Authorization: `Bearer ${await this.cacheManager.get("spotify_access_token")}`,
            },
          },
        ),
      );

      await this.cacheManager.set(CACHE_KEY, data, { ttl: CACHE_LIFETIME });

      return data;
    } catch {
      await this.refreshAccessToken();

      return this.getCurrentlyPlaying();
    }
  }
}
