import { Module } from "@nestjs/common";
import { EnvModule } from "./env/env.module";
import { ConfigModule } from "@nestjs/config";
import { envSchema } from "./env";
import { HttpModule } from "@nestjs/axios";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";
import { EnvService } from "./env/env.service";
import { SpotifyModule } from "./spotify/spotify.module";
import { ImageModule } from "./image/image.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (configService: EnvService) => ({
        store: redisStore,
        host: configService.get("REDIS_HOST"),
        port: configService.get("REDIS_PORT"),
      }),
      isGlobal: true,
    }),
    HttpModule,
    EnvModule,
    SpotifyModule,
    ImageModule,
  ],
})
export class AppModule {}
