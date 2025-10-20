import { Module } from '@nestjs/common';
import { StringsController } from './strings.controller';
import { StringsService } from './strings.service';

@Module({
  controllers: [StringsController],
  providers: [StringsService]
})
export class StringsModule {}
