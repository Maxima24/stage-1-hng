import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CUSTOM_AXIOS } from '../http/http-config.module';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import type { AxiosInstance } from 'axios';
import { UploadStringSchema } from './DTO/upload-string.dto';
import crypto from 'crypto';
import { join, dirname, resolve } from 'path';
import { GetStringSchema } from './DTO/get-string.dto copy';
import { GetStringFilterSchema, GetStringPartialFilterSchema } from './DTO/get-string-filter.dto';

export interface AnalyzedString {
  id: string;
  value: string;
  properties: {
    length: number;
    is_palindrome: boolean;
    unique_characters: number;
    word_count: number;
    sha256_hash: string;
    character_frequency_map: Record<string, number>;
  };
  created_at: string;
}

@Injectable()
export class StringsService {
  private readonly filePath = resolve(process.cwd(), 'data', 'strings.json');
  private strings: AnalyzedString[] = [];
  private readonly logger = new Logger(StringsService.name);

  private naturalWordFilter = [
    {
      query: "all single word palindromic strings",
      filter: { word_count: 1, is_palindrome: true }
    },
    {
      query: "strings longer than 10 characters",
      filter: { min_length: 10 }
    },
    {
      query: "palindromic strings that contain the first vowel",
      filter: { contains: ["vowel", 1], is_palindrome: true }
    },
    {
      query: "strings containing the letter z",
      filter: { contains_character: "z" }
    }
  ];

  constructor(
    private configService: ConfigService,
    @Inject(CUSTOM_AXIOS) private readonly axios: AxiosInstance,
  ) {
    this.ensureDataFolder();
    this.loadStringsFromFile();
  }

  // Ensure the "data" folder exists
  private ensureDataFolder() {
    const folder = dirname(this.filePath);
    if (!existsSync(folder)) {
      mkdirSync(folder, { recursive: true });
      this.logger.log(`Created folder: ${folder}`);
    }
  }

  private loadStringsFromFile() {
    this.logger.log(`Attempting to load from: ${this.filePath}`);
    if (existsSync(this.filePath)) {
      const fileContent = readFileSync(this.filePath, 'utf-8');
      this.strings = JSON.parse(fileContent);
      this.logger.log(`Loaded ${this.strings.length} strings from JSON file.`);
    } else {
      this.strings = [];
      this.logger.warn(`JSON file not found at ${this.filePath}, starting with empty array.`);
    }
  }

  private saveStringsToFile() {
    try {
      writeFileSync(this.filePath, JSON.stringify(this.strings, null, 2), 'utf-8');
      this.logger.log(`Successfully saved ${this.strings.length} strings to ${this.filePath}`);
    } catch (error) {
      this.logger.error(`Failed to save strings to file: ${error.message}`);
      throw new HttpException('Failed to save data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private isPalindrome(str: string) {
    return str === str.split('').reverse().join('');
  }

  private calculateNoOfWord(str: string) {
    return str.split(' ').length;
  }

  private getSHA256Hash(str: string) {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  private frequencyCheck(str: string): Record<string, number> {
    const freq: Record<string, number> = {};
    for (const char of str) {
      if (char === ' ') continue;
      freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
  }

  private countNumberOfUniqueChar(str: string) {
    const punctuationOnly = str.split('').filter((char) => /[^\w\s]/.test(char));
    return new Set(punctuationOnly).size;
  }

  private strongStringFilter(payload: GetStringFilterSchema) {
    const { is_palindrome, min_length, max_length, word_count, contains_character } = payload;

    console.log('Filter payload:', {
      is_palindrome,
      min_length,
      max_length,
      word_count,
      contains_character
    });
    console.log('Total strings to filter:', this.strings.length);

    const result = this.strings.filter((s) => {
      const p = s.properties;
      
      if (is_palindrome !== undefined && p.is_palindrome !== is_palindrome) {
        console.log(`Filtered out (palindrome): ${s.value}`);
        return false;
      }
      if (min_length !== undefined && p.length < min_length) {
        console.log(`Filtered out (min_length): ${s.value}`);
        return false;
      }
      if (max_length !== undefined && p.length > max_length) {
        console.log(`Filtered out (max_length): ${s.value}`);
        return false;
      }
      if (word_count !== undefined && p.word_count !== word_count) {
        console.log(`Filtered out (word_count): ${s.value}`);
        return false;
      }
      if (contains_character !== undefined && !s.value.includes(contains_character)) {
        console.log(`Filtered out (contains_character): ${s.value}`);
        return false;
      }
      
      console.log(`Passed filter: ${s.value}`);
      return true;
    });

    console.log('Filter results:', result.length, 'matches');
    return result;
  }
  private partialStringFilter(payload: GetStringPartialFilterSchema) {
    const vowels = ['a', 'e', 'i', 'o', 'u'];

    return this.strings.filter((s) => {
      const p = s.properties;

      if (payload.is_palindrome !== undefined && p.is_palindrome !== payload.is_palindrome)
        return false;

      if (payload.min_length !== undefined && p.length < payload.min_length) return false;
      if (payload.max_length !== undefined && p.length > payload.max_length) return false;
      if (payload.word_count !== undefined && p.word_count !== payload.word_count) return false;
      if (payload.contains_character !== undefined && !s.value.includes(payload.contains_character))
        return false;

      if (payload.contains) {
        const [term] = payload.contains;

        if (term === 'vowel') {
          // first letter must be a vowel
          if (!vowels.includes(s.value[0].toLowerCase())) return false;
        } else {
          // contains at least once
          if (!s.value.includes(String(term))) return false;
        }
      }

      return true;
    });
  }

  async upload(payload: UploadStringSchema) {
    try{
        const { value: string } = payload;
    const isExisting = this.strings.find((stringObj)=>stringObj.value === string)
    if(isExisting){
        throw new HttpException("String already exists in the system",HttpStatus.CONFLICT)
    }
    if (!string) throw new HttpException('Invalid request body or missing value field', HttpStatus.BAD_REQUEST);
    if (typeof string !== 'string') throw new HttpException('Invalid data type for "value" (must be string)', HttpStatus.UNPROCESSABLE_ENTITY);
    if (this.strings.some((s) => s.value === string))
      throw new HttpException('Value already exists', HttpStatus.CONFLICT);

    const length = string.length;
    const wordCount = this.calculateNoOfWord(string);
    const uniqueChars = this.countNumberOfUniqueChar(string);
    const isPalindrome = this.isPalindrome(string);
    const frequency = this.frequencyCheck(string);
    const sha256 = this.getSHA256Hash(string);

    const data: AnalyzedString = {
      id: sha256,
      value: string,
      properties: {
        length,
        is_palindrome: isPalindrome,
        unique_characters: uniqueChars,
        word_count: wordCount,
        sha256_hash: sha256,
        character_frequency_map: frequency
      },
      created_at: new Date().toISOString()
    };

    this.strings.push(data);
    this.saveStringsToFile();

    return data;
    }catch(error){
        if (error instanceof HttpException) {
    // Re-throw the HttpException as-is (preserves status code)
    throw error;
  } else {
    // Unknown error - throw 500
    throw new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

    }
    
  }

  async get(payload: GetStringSchema) {
    try{
   const { string_value } = payload;
   if(!string_value){
         throw new HttpException('Invalid request body or missing value field', HttpStatus.BAD_REQUEST);
   }
    const data = this.strings.find((s) => s.value === string_value);
    if(!data){
throw new HttpException("String does not exist in the system",HttpStatus.NOT_FOUND)
    }
    return data
    }catch(error){
          if (error instanceof HttpException) {
    // Re-throw the HttpException as-is (preserves status code)
    throw error;
  } else {
    // Unknown error - throw 500
    throw new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
    }
 
  }

  async getAll() {
    return this.strings;
  }

  async getFilter(payload: GetStringFilterSchema) {
    try{
        if(!payload){
            throw new HttpException("Invalid query parameter values or types",HttpStatus.BAD_REQUEST)
        }
            const data =this.strongStringFilter(payload);
            if(!data){
                throw new HttpException("Data not found",HttpStatus.NOT_FOUND)
            }

    }catch(error){
          if (error instanceof HttpException) {
    // Re-throw the HttpException as-is (preserves status code)
    throw error;
  } else {
    // Unknown error - throw 500
    throw new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
    }
    
  }

  async getFilterByNaturalLanguage(query: string) {
    try{
         if (!query || typeof query !== 'string') {
      throw new HttpException(
        'Unable to parse natural language query',
        HttpStatus.BAD_REQUEST
      );
    }
    
             console.log(query)
           
    const stringObject = this.naturalWordFilter.find((obj) => obj.query === query);
    if(!stringObject){
          throw new HttpException(
        'Unable to parse natural language query',
        HttpStatus.BAD_REQUEST
      );
    }
    const { min_length, max_length } = stringObject?.filter as any;
    if (min_length && max_length && min_length > max_length) {
      throw new HttpException(
        'Query parsed but resulted in conflicting filters',
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }

    if (stringObject) {
        const filter =this.partialStringFilter(stringObject.filter);
           const data = {
      data: filter,
      count: filter.length,
      interpreted_query: {
        original: query,
        parsed_filters: stringObject.filter
      }
    };
        return data
        
    }
    }catch(error){
        if (error instanceof HttpException) {
    // Re-throw the HttpException as-is (preserves status code)
    throw error;
  } else {
    // Unknown error - throw 500
    throw new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
    }
   
  }
  async delete(payload:GetStringSchema){
    try{
       
  const { string_value } = payload;
  
  if (!string_value) {
    throw new HttpException('Missing string_value', HttpStatus.BAD_REQUEST);
  }

  const index = this.strings.findIndex((s) => s.value === string_value);
  
  if (index === -1) {
    throw new HttpException('String not found', HttpStatus.NOT_FOUND);
  }

  const deletedString = this.strings.splice(index, 1)[0];
  this.saveStringsToFile();
  
  return 

    }catch(error){
           if (error instanceof HttpException) {
    // Re-throw the HttpException as-is (preserves status code)
    throw error;
  } else {
    // Unknown error - throw 500
    throw new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
    }
  }
}