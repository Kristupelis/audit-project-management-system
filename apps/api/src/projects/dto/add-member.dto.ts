import { IsEmail, IsEnum } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class AddMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(ProjectRole)
  role!: ProjectRole; // READER | EDITOR | ADMIN
}
