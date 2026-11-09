import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface.js';
import { ApplicantSectionsService } from './applicant-sections.service.js';
import { ApplicantsService } from './applicants.service.js';
import { AddLanguageDto } from './dto/add-language.dto.js';
import { AddSkillDto } from './dto/add-skill.dto.js';
import { SaveEducationDto } from './dto/save-education.dto.js';
import { SaveExperienceDto } from './dto/save-experience.dto.js';
import { UpdateLanguageDto } from './dto/update-language.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

@ApiTags('Perfil del postulante')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.APPLICANT)
@Controller('applicants/me')
export class ApplicantsController {
  constructor(
    private readonly applicantsService: ApplicantsService,
    private readonly sectionsService: ApplicantSectionsService,
  ) {}

  @Get()
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.applicantsService.getMyProfile(request.user.id);
  }

  @Put()
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
    @Ip() ip: string,
  ) {
    return this.applicantsService.updateMyProfile(request.user.id, dto, ip);
  }

  @Post('photo')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 0 },
    }),
  )
  updatePhoto(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Ip() ip: string,
  ) {
    return this.applicantsService.updatePhoto(request.user.id, file, ip);
  }

  @Post('educations')
  addEducation(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SaveEducationDto,
    @Ip() ip: string,
  ) {
    return this.sectionsService.addEducation(request.user.id, dto, ip);
  }

  @Put('educations/:id')
  updateEducation(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveEducationDto,
    @Ip() ip: string,
  ) {
    return this.sectionsService.updateEducation(request.user.id, id, dto, ip);
  }

  @Delete('educations/:id')
  removeEducation(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.sectionsService.removeEducation(request.user.id, id, ip);
  }

  @Post('experiences')
  addExperience(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SaveExperienceDto,
    @Ip() ip: string,
  ) {
    return this.sectionsService.addExperience(request.user.id, dto, ip);
  }

  @Put('experiences/:id')
  updateExperience(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveExperienceDto,
    @Ip() ip: string,
  ) {
    return this.sectionsService.updateExperience(request.user.id, id, dto, ip);
  }

  @Delete('experiences/:id')
  removeExperience(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.sectionsService.removeExperience(request.user.id, id, ip);
  }

  @Post('skills')
  addSkill(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AddSkillDto,
    @Ip() ip: string,
  ) {
    return this.sectionsService.addSkill(request.user.id, dto, ip);
  }

  @Patch('skills/:id')
  updateSkill(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSkillDto,
    @Ip() ip: string,
  ) {
    return this.sectionsService.updateSkill(request.user.id, id, dto, ip);
  }

  @Delete('skills/:id')
  removeSkill(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.sectionsService.removeSkill(request.user.id, id, ip);
  }

  @Post('languages')
  addLanguage(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AddLanguageDto,
    @Ip() ip: string,
  ) {
    return this.sectionsService.addLanguage(request.user.id, dto, ip);
  }

  @Patch('languages/:id')
  updateLanguage(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLanguageDto,
    @Ip() ip: string,
  ) {
    return this.sectionsService.updateLanguage(request.user.id, id, dto, ip);
  }

  @Delete('languages/:id')
  removeLanguage(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.sectionsService.removeLanguage(request.user.id, id, ip);
  }
}
