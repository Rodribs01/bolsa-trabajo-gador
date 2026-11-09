import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { ChangePassword } from './pages/account/change-password/change-password';
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
    path: 'change-password',
    component: ChangePassword,
    canActivate: [roleGuard],
    data: { roles: ['POSTULANTE', 'EMPRESA', 'SUPERADMIN'] },
    title: 'Cambiar contraseña',
  },
  { path: '**', redirectTo: '' },
];
