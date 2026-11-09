import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { AuditService } from '../audit/audit.service.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { Favorite } from './entities/favorite.entity.js';
import { PublicJobOffersService } from './public-job-offers.service.js';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    private readonly publicJobOffersService: PublicJobOffersService,
    private readonly auditService: AuditService,
  ) {}

  async findMine(userId: number, dto: PaginationDto) {
    const profileId = await this.findProfileId(userId);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const [favorites, total] = await this.favoriteRepository.findAndCount({
      where: { profileId: profileId },
      relations: {
        jobOffer: {
          company: { sector: true },
          contractType: true,
          modality: true,
          municipality: true,
        },
      },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = [];
    for (const favorite of favorites) {
      items.push({
        savedAt: favorite.createdAt,
        available: this.publicJobOffersService.isOpen(favorite.jobOffer),
        offer: this.publicJobOffersService.toPublicSummary(favorite.jobOffer),
      });
    }
    return { items: items, total: total, page: page, limit: limit };
  }

  async add(userId: number, offerId: number, ip: string) {
    const profileId = await this.findProfileId(userId);

    const offer = await this.publicJobOffersService.findOpenOffer(offerId);
    if (!offer) {
      throw new NotFoundException(
        'La oferta no existe o ya no está disponible',
      );
    }

    let favorite: Favorite;
    try {
      favorite = await this.favoriteRepository.save(
        this.favoriteRepository.create({
          profileId: profileId,
          jobOfferId: offerId,
        }),
      );
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Esta oferta ya está en tus favoritos');
      }
      throw error;
    }

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CREATE,
      tableName: 'favoritos',
      recordId: favorite.id,
      newData: { oferta_id: offerId },
      ip: ip,
    });

    return { jobOfferId: offerId, savedAt: favorite.createdAt };
  }

  async remove(userId: number, offerId: number, ip: string) {
    const profileId = await this.findProfileId(userId);

    const favorite = await this.favoriteRepository.findOneBy({
      profileId: profileId,
      jobOfferId: offerId,
    });
    if (!favorite) {
      throw new NotFoundException('Esta oferta no está en tus favoritos');
    }
    await this.favoriteRepository.delete({ id: favorite.id });

    await this.auditService.log({
      userId: userId,
      action: AuditAction.DELETE,
      tableName: 'favoritos',
      recordId: favorite.id,
      previousData: { oferta_id: offerId },
      ip: ip,
    });

    return { message: 'Oferta quitada de tus favoritos' };
  }

  private async findProfileId(userId: number): Promise<number> {
    const profile = await this.profileRepository.findOneBy({ userId: userId });
    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }
    return profile.id;
  }
}
