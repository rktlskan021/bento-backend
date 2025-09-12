import { Test, TestingModule } from '@nestjs/testing';
import { TextSearchService } from './text-search.service';

describe('TextSearchService', () => {
  let service: TextSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TextSearchService],
    }).compile();

    service = module.get<TextSearchService>(TextSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
