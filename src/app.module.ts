import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { EnvModule } from "./env/env.module";
import { ConfigModule } from "@nestjs/config";
import { envSchema } from "./env";
import { HttpModule } from "@nestjs/axios";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    HttpModule,
    EnvModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
