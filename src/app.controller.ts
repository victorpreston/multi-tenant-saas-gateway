import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
@ApiTags('general')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Welcome message',
    schema: { example: 'Hello World!' },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
