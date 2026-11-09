export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

export interface MessageResponse {
  message: string;
}

export interface RegisterApplicantData {
  ci: string;
  ciIssuedIn: string;
  firstNames: string;
  lastNames: string;
  phone: string;
  email: string;
  password: string;
}
