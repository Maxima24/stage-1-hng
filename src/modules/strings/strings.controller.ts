import { Controller, Post, Body, Param, Get,Query,Delete, HttpCode } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StringsService } from './strings.service';
import { UploadStringSchema } from './DTO/upload-string.dto';
import { GetStringSchema } from './DTO/get-string.dto copy';

const configService = new ConfigService();
const RATE_LIMIT = Number(configService.get('RATE_LIMIT')!) || 5;
const RATE_LIMIT_MS = Number(configService.get('RATE_LIMIT_MS')!) || 60000;

@Controller('strings')
export class StringsController {
  constructor(private readonly stringService: StringsService) {}

  @Post()
  @HttpCode(201)
  async uploadString(@Body() payload: UploadStringSchema) {
    const string = await this.stringService.upload(payload);
    return string;
  }

  @Get('all')
  async getAllStrings() {
    return await this.stringService.getAll();
  }
@Get('filter-by-natural-language')
async getNaturalLanguageFilter(@Query('query') query: string) {
  console.log(`Natural language query: "${query}"`);
  const res = await this.stringService.getFilterByNaturalLanguage(query);
  return res;
}

  @Get()
  async searchString(@Query() query: any) {
    console.log(`Query parameters:`, query);
    
    if (query.value) {
      // Search by string value
      const res = await this.stringService.get({ string_value: query.value });
      return res;
    }
    
    if (query.is_palindrome || query.min_length || query.max_length || query.word_count || query.contains_character) {
      // Filter with multiple criteria - remove undefined values
      const filterPayload: any = {};
      
      if (query.is_palindrome !== undefined) {
        filterPayload.is_palindrome = query.is_palindrome === 'true' ? true : query.is_palindrome === 'false' ? false : undefined;
      }
      if (query.min_length !== undefined) {
        filterPayload.min_length = Number(query.min_length);
      }
      if (query.max_length !== undefined) {
        filterPayload.max_length = Number(query.max_length);
      }
      if (query.word_count !== undefined) {
        filterPayload.word_count = Number(query.word_count);
      }
      if (query.contains_character !== undefined) {
        filterPayload.contains_character = query.contains_character;
      }
      
      const res = await this.stringService.getFilter(filterPayload);
      return res;
    }
    
    return [];
  }
   @Get(':string_value')
  async getStringData(@Param('string_value') string_value: string) {
    console.log(`Searching for: "${string_value}"`);
    const res = await this.stringService.get({ string_value });
    console.log(`Found: ${JSON.stringify(res)}`);
    return res;
  }
    @Delete(':string_value')
    @HttpCode(204)
  async deleteString(@Param('string_value') string_value: string) {
    return await this.stringService.delete({ string_value });
  }
}
