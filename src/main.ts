import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "~/app.module";
import { EnvService } from "~/env/env.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const env = app.get(EnvService);
  const port = env.get("PORT");

  Logger.log(`Running on port ${port}`);
  await app.listen(port);
}

bootstrap();
