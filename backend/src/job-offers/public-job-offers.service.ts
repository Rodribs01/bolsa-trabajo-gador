import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CompanyStatus } from '../common/enums/company-status.enum.js';
import { JobOfferStatus } from '../common/enums/job-offer-status.enum.js';
import { SearchJobOffersDto } from './dto/search-job-offers.dto.js';
import { JobOffer } from './entities/job-offer.entity.js';

@Injectable()
export class PublicJobOffersService {
  constructor(
    @InjectRepository(JobOffer)
    private readonly offerRepository: Repository<JobOffer>,
  ) {}

  async search(dto: SearchJobOffersDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const query = this.visibleOffersQuery();
    this.applyFilters(query, dto);
    this.applySort(query, dto.sort);

    const [offers, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const items = [];
    for (const offer of offers) {
      items.push(this.toPublicSummary(offer));
    }
    return { items: items, total: total, page: page, limit: limit };
  }

  async findOne(id: number) {
    const offer = await this.visibleOffersQuery()
      .leftJoinAndSelect('offer.professions', 'offerProfession')
      .leftJoinAndSelect('offerProfession.profession', 'profession')
      .leftJoinAndSelect('offer.skills', 'offerSkill')
      .leftJoinAndSelect('offerSkill.skill', 'skill')
      .andWhere('offer.id = :id', { id: id })
      .getOne();
    if (!offer) {
      throw new NotFoundException(
        'La oferta no existe o ya no está disponible',
      );
    }

    await this.offerRepository.increment({ id: id }, 'totalViews', 1);

    const professions = [];
    for (const item of offer.professions) {
      professions.push({ id: item.profession.id, name: item.profession.name });
    }
    const skills = [];
    for (const item of offer.skills) {
      skills.push({
        id: item.skill.id,
        name: item.skill.name,
        required: item.required,
      });
    }

    return {
      ...this.toPublicSummary(offer),
      description: offer.description,
      requiredRequirements: offer.requiredRequirements,
      desiredRequirements: offer.desiredRequirements,
      yearsOfExperience: offer.yearsOfExperience,
      benefits: offer.benefits,
      vacancies: offer.vacancies,
      professions: professions,
      skills: skills,
    };
  }

  // Solo se muestran ofertas publicadas, vigentes y de empresas aprobadas
  private visibleOffersQuery(): SelectQueryBuilder<JobOffer> {
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/La_Paz',
    });

    return this.offerRepository
      .createQueryBuilder('offer')
      .innerJoinAndSelect('offer.company', 'company')
      .leftJoinAndSelect('company.sector', 'sector')
      .leftJoinAndSelect('offer.contractType', 'contractType')
      .leftJoinAndSelect('offer.modality', 'modality')
      .leftJoinAndSelect('offer.municipality', 'municipality')
      .where('offer.status = :status', { status: JobOfferStatus.PUBLISHED })
      .andWhere('company.status = :companyStatus', {
        companyStatus: CompanyStatus.APPROVED,
      })
      .andWhere('offer.closingDate >= :today', { today: today });
  }

  private applyFilters(
    query: SelectQueryBuilder<JobOffer>,
    dto: SearchJobOffersDto,
  ): void {
    if (dto.keyword) {
      query.andWhere(
        '(offer.title LIKE :keyword OR offer.description LIKE :keyword OR company.businessName LIKE :keyword)',
        { keyword: `%${dto.keyword}%` },
      );
    }
    if (dto.professionId) {
      query.innerJoin(
        'offer.professions',
        'filterProfession',
        'filterProfession.professionId = :professionId',
        { professionId: dto.professionId },
      );
    }
    if (dto.municipalityId) {
      query.andWhere('offer.municipalityId = :municipalityId', {
        municipalityId: dto.municipalityId,
      });
    }
    if (dto.modalityId) {
      query.andWhere('offer.modalityId = :modalityId', {
        modalityId: dto.modalityId,
      });
    }
    if (dto.minSalary !== undefined) {
      const condition = dto.includeNegotiable
        ? '(offer.maxSalary >= :minSalary OR offer.salaryToNegotiate = true)'
        : 'offer.maxSalary >= :minSalary';
      query.andWhere(condition, { minSalary: dto.minSalary });
    }
  }

  private applySort(
    query: SelectQueryBuilder<JobOffer>,
    sort: string | undefined,
  ): void {
    if (sort === 'closing') {
      query.orderBy('offer.closingDate', 'ASC');
    } else if (sort === 'salary') {
      query.orderBy('offer.maxSalary', 'DESC');
    } else {
      query.orderBy('offer.publishedAt', 'DESC');
    }
    query.addOrderBy('offer.id', 'DESC');
  }

  private toPublicSummary(offer: JobOffer) {
    return {
      id: offer.id,
      title: offer.title,
      closingDate: offer.closingDate,
      publishedAt: offer.publishedAt,
      minSalary: offer.minSalary,
      maxSalary: offer.maxSalary,
      salaryToNegotiate: offer.salaryToNegotiate,
      contractType: offer.contractType.name,
      modality: offer.modality.name,
      municipality: offer.municipality.name,
      company: {
        id: offer.company.id,
        businessName: offer.company.businessName,
        logo: offer.company.logo,
        description: offer.company.description,
        sector: offer.company.sector.name,
      },
    };
  }
}
