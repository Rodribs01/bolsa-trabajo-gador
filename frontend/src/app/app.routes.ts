import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { ChangePassword } from './pages/account/change-password/change-password';
import { Notifications } from './pages/account/notifications/notifications';
import { Companies } from './pages/admin/companies/companies';
import { OffersReview } from './pages/admin/offers-review/offers-review';
import { ApplicantDetail } from './pages/company/applicant-detail/applicant-detail';
import { Dashboard as CompanyDashboard } from './pages/company/dashboard/dashboard';
import { OfferApplicants } from './pages/company/offer-applicants/offer-applicants';
import { OfferForm } from './pages/company/offer-form/offer-form';
import { Offers } from './pages/company/offers/offers';
import { Applications } from './pages/applicant/applications/applications';
import { Dashboard as ApplicantDashboard } from './pages/applicant/dashboard/dashboard';
import { Favorites } from './pages/applicant/favorites/favorites';
import { Profile as ApplicantProfile } from './pages/applicant/profile/profile';
import { CompanyRequestSent } from './pages/public/company-request-sent/company-request-sent';
import { ForgotPassword } from './pages/public/forgot-password/forgot-password';
import { Home } from './pages/public/home/home';
import { Login } from './pages/public/login/login';
import { OfferDetail } from './pages/public/offer-detail/offer-detail';
import { OfferList } from './pages/public/offer-list/offer-list';
import { RegisterApplicant } from './pages/public/register-applicant/register-applicant';
import { RegisterCompany } from './pages/public/register-company/register-company';
import { ResetPassword } from './pages/public/reset-password/reset-password';
import { VerifyEmail } from './pages/public/verify-email/verify-email';

export const routes: Routes = [
  { path: '', component: Home, title: 'Bolsa de Trabajo Departamental - GADOR' },
  { path: 'job-offers', component: OfferList, title: 'Ofertas de trabajo' },
  { path: 'job-offers/:id', component: OfferDetail, title: 'Detalle de la oferta' },
  { path: 'login', component: Login, title: 'Iniciar sesión' },
  { path: 'register/applicant', component: RegisterApplicant, title: 'Registro de postulante' },
  { path: 'register/company', component: RegisterCompany, title: 'Registro de empresa' },
  { path: 'register/company/sent', component: CompanyRequestSent, title: 'Solicitud enviada' },
  { path: 'verify-email', component: VerifyEmail, title: 'Verifica tu correo' },
  { path: 'forgot-password', component: ForgotPassword, title: 'Recuperar contraseña' },
  { path: 'reset-password', component: ResetPassword, title: 'Nueva contraseña' },
  {
    path: 'applicant',
    canActivate: [roleGuard],
    data: { roles: ['POSTULANTE'] },
    children: [
      { path: '', component: ApplicantDashboard, title: 'Mi panel' },
      { path: 'profile', component: ApplicantProfile, title: 'Mi perfil' },
      { path: 'applications', component: Applications, title: 'Mis postulaciones' },
      { path: 'favorites', component: Favorites, title: 'Favoritos' },
    ],
  },
  {
    path: 'company',
    canActivate: [roleGuard],
    data: { roles: ['EMPRESA'] },
    children: [
      { path: '', component: CompanyDashboard, title: 'Panel de la empresa' },
      { path: 'job-offers', component: Offers, title: 'Mis ofertas' },
      { path: 'job-offers/new', component: OfferForm, title: 'Nueva oferta' },
      { path: 'job-offers/:id/edit', component: OfferForm, title: 'Editar oferta' },
      { path: 'job-offers/:id/applications', component: OfferApplicants, title: 'Postulantes' },
      { path: 'applications/:id', component: ApplicantDetail, title: 'Perfil del postulante' },
    ],
  },
  {
    path: 'admin',
    canActivate: [roleGuard],
    data: { roles: ['SUPERADMIN'] },
    children: [
      { path: '', redirectTo: 'companies', pathMatch: 'full' },
      { path: 'companies', component: Companies, title: 'Validación de empresas' },
      { path: 'job-offers', component: OffersReview, title: 'Ofertas por revisar' },
    ],
  },
  {
    path: 'change-password',
    component: ChangePassword,
    canActivate: [roleGuard],
    data: { roles: ['POSTULANTE', 'EMPRESA', 'SUPERADMIN'] },
    title: 'Cambiar contraseña',
  },
  {
    path: 'notifications',
    component: Notifications,
    canActivate: [roleGuard],
    data: { roles: ['POSTULANTE', 'EMPRESA', 'SUPERADMIN'] },
    title: 'Notificaciones',
  },
  { path: '**', redirectTo: '' },
];
