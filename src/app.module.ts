import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersonModule } from './person/person.module';
import { ConceptModule } from './concept/concept.module';
import { CohortModule } from './cohort/cohort.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import * as dotenv from 'dotenv';
import { User } from 'src/user/user.entity';
import { SettingModule } from './setting/setting.module';
import { TextSearchModule } from './text-search/text-search.module';
import { DataBrowserModule } from './data-browser/data-browser.module';
dotenv.config();

@Module({
  imports: [
    DataBrowserModule, PersonModule, ConceptModule, CohortModule, UserModule, AuthModule, SettingModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.ATLAS_DB_HOST || 'localhost',
      port: Number(process.env.ATLAS_DB_PORT),
      username: process.env.ATLAS_DB_USER,
      password: process.env.ATLAS_DB_PASS,
      database: process.env.ATLAS_DB_NAME,
      entities: [User],
      synchronize: false,
      logging: true,
    }),
    TextSearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
