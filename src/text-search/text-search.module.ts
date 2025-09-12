import { Module } from '@nestjs/common';
import { TextSearchService } from './text-search.service';
import { TextSearchController } from './text-search.controller';

@Module({
  providers: [TextSearchService],
  controllers: [TextSearchController]
})
export class TextSearchModule {}
