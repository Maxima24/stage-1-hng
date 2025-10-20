import {IsString} from "class-validator"
export class UploadStringSchema{
    @IsString()
    value:string
}