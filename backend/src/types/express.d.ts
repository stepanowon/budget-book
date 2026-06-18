import { UserPayload } from './domain';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      groupRole?: string;
    }
  }
}
