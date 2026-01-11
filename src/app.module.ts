import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
