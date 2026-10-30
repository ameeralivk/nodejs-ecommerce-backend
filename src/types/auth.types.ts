import { IUser } from './user.types';

export interface JwtPayload {
  id: string;
  role: string;
}

export interface AuthResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}
