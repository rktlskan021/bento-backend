// src/data-browser/data-browser.module.ts

import { Module } from '@nestjs/common';
import { DataBrowserController } from './data-browser.controller';
import { DataBrowserService } from './data-browser.service';

@Module({
  controllers: [DataBrowserController],
  providers: [DataBrowserService],
})
export class DataBrowserModule {}