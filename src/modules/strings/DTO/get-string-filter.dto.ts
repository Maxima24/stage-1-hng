import { IsBoolean, IsInt, IsString,IsArray } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";

export class GetStringFilterSchema {
  @IsBoolean()
  is_palindrome: boolean;

  @IsInt()
  min_length: number;

  @IsInt()
  max_length: number;

  @IsInt()
  word_count: number;

  @IsString()
  contains_character: string;
}

// Create a partial version where all fields are optional
export class GetStringPartialFilterSchema extends PartialType(GetStringFilterSchema) {
     @IsArray()
  contains?: (string |number)[];
}
