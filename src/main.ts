import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "~/app.module";
import { EnvService } from "~/env/env.service";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors();

  const env = app.get(EnvService);
  const port = env.get("PORT");

  Logger.log(`Running on port ${port}`);
  await app.listen(port);
}

bootstrap();
