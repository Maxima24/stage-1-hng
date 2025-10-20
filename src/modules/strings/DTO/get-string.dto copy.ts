import {IsString} from "class-validator"
export class GetStringSchema{
    @IsString()
    string_value:string
}