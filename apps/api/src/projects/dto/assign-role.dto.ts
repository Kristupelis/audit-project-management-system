import { IsString } from 'class-validator';

export class AssignProjectRoleDto {
  @IsString()
  memberId: string;

  @IsString()
  roleId: string;
}
