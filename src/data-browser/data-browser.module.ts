import { Module } from '@nestjs/common';
import { DataBrowserController } from './data-browser.controller';
import { DataBrowserService } from './data-browser.service';
import { Kysely } from 'kysely';
import { db } from '../db/types';   

@Module({
  controllers: [DataBrowserController],
  providers: [
    DataBrowserService,
    {
      provide: Kysely,
      useValue: db,
    },
  ],
})
export class DataBrowserModule {}