import { Request } from 'express';
import { RoleName } from '../enums/role-name.enum.js';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: RoleName;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
