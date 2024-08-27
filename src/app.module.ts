import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { EnvModule } from "./env/env.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { envSchema } from "./env";
import { HttpModule } from "@nestjs/axios";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get("REDIS_HOST"),
        port: configService.get("REDIS_PORT"),
        isGlobal: true,
      }),
    }),
    HttpModule,
    EnvModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
