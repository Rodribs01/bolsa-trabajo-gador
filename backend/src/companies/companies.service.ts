import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { Catalog } from '../catalogs/entities/catalog.entity.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { CatalogType } from '../common/enums/catalog-type.enum.js';
import { CompanyStatus } from '../common/enums/company-status.enum.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import { FileStorageService } from '../common/files/file-storage.service.js';
import { Role } from '../users/entities/role.entity.js';
import { User } from '../users/entities/user.entity.js';
import { ListCompaniesDto } from './dto/list-companies.dto.js';
import { RegisterCompanyDto } from './dto/register-company.dto.js';
import { Company } from './entities/company.entity.js';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGOS_FOLDER = 'public/logos';
const DOCUMENTS_FOLDER = 'private/documents';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Catalog)
    private readonly catalogRepository: Repository<Catalog>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly fileStorage: FileStorageService,
  ) {}

  async register(
    dto: RegisterCompanyDto,
    logo: Express.Multer.File | undefined,
    document: Express.Multer.File | undefined,
    ip: string,
  ) {
    if (!document) {
      throw new BadRequestException('El documento de respaldo es obligatorio');
    }
    this.validateFiles(logo, document);
    await this.validateCatalog(dto.sectorId, CatalogType.SECTOR, 'El rubro');
    await this.validateCatalog(
      dto.municipalityId,
      CatalogType.MUNICIPALITY,
      'El municipio',
    );

    if (await this.userRepository.existsBy({ email: dto.email })) {
      throw new ConflictException('El correo ya está registrado');
    }
    if (await this.companyRepository.existsBy({ nit: dto.nit })) {
      throw new ConflictException('El NIT ya está registrado');
    }

    const role = await this.roleRepository.findOneByOrFail({
      name: RoleName.COMPANY,
    });
    const passwordHash = await bcrypt.hash(dto.password, 10);

    let logoName: string | null = null;
    let documentName: string | null = null;
    let company: Company;
    try {
      if (logo) {
        logoName = await this.fileStorage.save(LOGOS_FOLDER, logo);
      }
      documentName = await this.fileStorage.save(DOCUMENTS_FOLDER, document);
      company = await this.createCompany(
        dto,
        role.id,
        passwordHash,
        logoName,
        documentName,
      );
    } catch (error: any) {
      await this.deleteFiles(logoName, documentName);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('El correo o el NIT ya están registrados');
      }
      throw error;
    }

    await this.auditService.log({
      userId: company.userId,
      action: AuditAction.CREATE,
      tableName: 'empresas',
      recordId: company.id,
      newData: { nit: company.nit, estado: company.status },
      ip: ip,
    });

    return {
      message:
        'Registramos tu empresa. Queda pendiente de validación por la Gobernación.',
      email: dto.email,
    };
  }

  async findAll(dto: ListCompaniesDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const [items, total] = await this.companyRepository.findAndCount({
      where: dto.status ? { status: dto.status } : {},
      relations: { sector: true, municipality: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: items, total: total, page: page, limit: limit };
  }

  async findOne(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id: id },
      relations: { sector: true, municipality: true },
    });
    if (!company) {
      throw new NotFoundException('La empresa no existe');
    }
    return company;
  }

  async findByUser(userId: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { userId: userId },
      relations: { sector: true, municipality: true },
    });
    if (!company) {
      throw new NotFoundException('La empresa no existe');
    }
    return company;
  }

  async getDocument(id: number): Promise<StreamableFile> {
    const company = await this.findOne(id);
    const stream = this.fileStorage.open(
      DOCUMENTS_FOLDER,
      company.supportDocument,
    );
    if (!stream) {
      throw new NotFoundException(
        'El documento de respaldo no está disponible',
      );
    }
    return new StreamableFile(stream, {
      type: 'application/pdf',
      disposition: `inline; filename="respaldo-empresa-${id}.pdf"`,
    });
  }

  async approve(id: number, adminId: number, ip: string): Promise<Company> {
    return this.changeStatus(
      id,
      [CompanyStatus.PENDING, CompanyStatus.SUSPENDED],
      CompanyStatus.APPROVED,
      null,
      adminId,
      ip,
    );
  }

  async reject(
    id: number,
    reason: string,
    adminId: number,
    ip: string,
  ): Promise<Company> {
    return this.changeStatus(
      id,
      [CompanyStatus.PENDING],
      CompanyStatus.REJECTED,
      reason,
      adminId,
      ip,
    );
  }

  async suspend(id: number, adminId: number, ip: string): Promise<Company> {
    return this.changeStatus(
      id,
      [CompanyStatus.APPROVED],
      CompanyStatus.SUSPENDED,
      null,
      adminId,
      ip,
    );
  }

  private async changeStatus(
    id: number,
    allowedFrom: CompanyStatus[],
    newStatus: CompanyStatus,
    rejectionReason: string | null,
    adminId: number,
    ip: string,
  ): Promise<Company> {
    const company = await this.findOne(id);
    const previousStatus = company.status;

    if (!allowedFrom.includes(previousStatus)) {
      throw new BadRequestException(
        'La empresa no puede pasar a ese estado desde su estado actual',
      );
    }

    const result = await this.companyRepository.update(
      { id: id, status: previousStatus },
      {
        status: newStatus,
        rejectionReason: rejectionReason,
        validatedById: adminId,
        validatedAt: new Date(),
      },
    );
    if (result.affected !== 1) {
      throw new ConflictException(
        'El estado de la empresa cambió. Vuelve a cargar la página',
      );
    }

    await this.auditService.log({
      userId: adminId,
      action: AuditAction.CHANGE_STATUS,
      tableName: 'empresas',
      recordId: id,
      previousData: { estado: previousStatus },
      newData: { estado: newStatus, motivo_rechazo: rejectionReason },
      ip: ip,
    });

    return this.findOne(id);
  }

  private validateFiles(
    logo: Express.Multer.File | undefined,
    document: Express.Multer.File,
  ): void {
    if (!this.fileStorage.isPdf(document)) {
      throw new BadRequestException('El documento de respaldo debe ser un PDF');
    }
    if (logo && !this.fileStorage.isImage(logo)) {
      throw new BadRequestException('El logo debe ser una imagen PNG o JPG');
    }
    if (logo && logo.size > MAX_LOGO_BYTES) {
      throw new BadRequestException('El logo debe pesar como máximo 2 MB');
    }
  }

  private async validateCatalog(
    id: number,
    type: CatalogType,
    label: string,
  ): Promise<void> {
    const exists = await this.catalogRepository.existsBy({
      id: id,
      type: type,
      active: true,
    });
    if (!exists) {
      throw new BadRequestException(`${label} seleccionado no es válido`);
    }
  }

  private async createCompany(
    dto: RegisterCompanyDto,
    roleId: number,
    passwordHash: string,
    logoName: string | null,
    documentName: string,
  ): Promise<Company> {
    return this.dataSource.transaction(async (manager) => {
      // La empresa no verifica su correo: la valida la Gobernación
      const user = manager.create(User, {
        roleId: roleId,
        name: dto.businessName,
        email: dto.email,
        phone: dto.phone,
        password: passwordHash,
        emailVerified: true,
      });
      await manager.save(user);

      const company = manager.create(Company, {
        userId: user.id,
        nit: dto.nit,
        businessName: dto.businessName,
        sectorId: dto.sectorId,
        legalRepresentative: dto.legalRepresentative,
        representativeCi: dto.representativeCi,
        phone: dto.phone,
        corporateEmail: dto.email,
        address: dto.address,
        municipalityId: dto.municipalityId,
        logo: logoName,
        supportDocument: documentName,
        description: dto.description,
      });
      await manager.save(company);

      return company;
    });
  }

  private async deleteFiles(
    logoName: string | null,
    documentName: string | null,
  ): Promise<void> {
    if (logoName) {
      await this.fileStorage.delete(LOGOS_FOLDER, logoName);
    }
    if (documentName) {
      await this.fileStorage.delete(DOCUMENTS_FOLDER, documentName);
    }
  }
}
