import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantsModule } from './applicants/applicants.module.js';
import { ApplicationsModule } from './applications/applications.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CatalogsModule } from './catalogs/catalogs.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { JobOffersModule } from './job-offers/job-offers.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { dataSourceOptions } from './database/data-source.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
      errorMessage:
        'Demasiadas solicitudes. Espera un momento y vuelve a intentarlo',
    }),
    ApplicantsModule,
    ApplicationsModule,
    AuditModule,
    AuthModule,
    CatalogsModule,
    CompaniesModule,
    DashboardModule,
    JobOffersModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
