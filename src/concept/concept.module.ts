import { Module } from '@nestjs/common';
import { ConceptController } from './concept.controller';
import { ConceptService } from './concept.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [ConceptController],
  providers: [ConceptService]
})
export class ConceptModule {}
