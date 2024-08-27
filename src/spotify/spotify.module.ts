import { Module } from "@nestjs/common";
import { SpotifyService } from "./spotify.service";
import { SpotifyController } from "./spotify.controller";
import { EnvModule } from "~/env/env.module";
import { HttpModule } from "@nestjs/axios";
import { ImageModule } from "~/image/image.module";

@Module({
  imports: [EnvModule, HttpModule, ImageModule],
  providers: [SpotifyService],
  exports: [SpotifyService],
  controllers: [SpotifyController],
})
export class SpotifyModule {}
