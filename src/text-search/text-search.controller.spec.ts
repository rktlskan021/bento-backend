import { Test, TestingModule } from '@nestjs/testing';
import { TextSearchController } from './text-search.controller';

describe('TextSearchController', () => {
  let controller: TextSearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TextSearchController],
    }).compile();

    controller = module.get<TextSearchController>(TextSearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
