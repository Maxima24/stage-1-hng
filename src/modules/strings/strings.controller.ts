import { Controller, Post, Body, Param, Get, Query, Delete, HttpException, HttpCode } from '@nestjs/common';
import { StringsService } from './strings.service';
import { UploadStringSchema } from './DTO/upload-string.dto';

@Controller('strings')
export class StringsController {
  constructor(private readonly stringService: StringsService) {}

  @Post()
  @HttpCode(201)
  async uploadString(@Body() payload: UploadStringSchema){
    return this.stringService.upload(payload);
  }

  @Get('all')
  async getAllStrings() {
    return this.stringService.getAll();
  }

  @Get('filter-by-natural-language')
  async getNaturalLanguageFilter(@Query('query') query: string) {
    return this.stringService.getFilterByNaturalLanguage(query);
  }

  @Get()
  async searchString(@Query() query: any) {
    if (query.value) {
      const res = await this.stringService.get({ string_value: query.value });
      if (!res) throw new HttpException('String not found', 404);
      return res;
    }

    if (query.is_palindrome || query.min_length || query.max_length || query.word_count || query.contains_character) {
      const filterPayload: any = {};
      if (query.is_palindrome !== undefined) filterPayload.is_palindrome = query.is_palindrome === 'true';
      if (query.min_length !== undefined) filterPayload.min_length = Number(query.min_length);
      if (query.max_length !== undefined) filterPayload.max_length = Number(query.max_length);
      if (query.word_count !== undefined) filterPayload.word_count = Number(query.word_count);
      if (query.contains_character !== undefined) filterPayload.contains_character = query.contains_character;
      return this.stringService.getFilter(filterPayload);
    }

    return this.stringService.getAll();
  }

  @Get(':string_value')
  async getStringData(@Param('string_value') string_value: string) {
    const res = await this.stringService.get({ string_value });
    if (!res) throw new HttpException('String not found', 404);
    return res;
  }

  @Delete(':string_value')
  @HttpCode(204)
  async deleteString(@Param('string_value') string_value: string) {
    const deleted = await this.stringService.delete({ string_value });
    if (!deleted) throw new HttpException('String not found', 404);
  }
}
