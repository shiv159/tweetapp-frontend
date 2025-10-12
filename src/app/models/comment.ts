import { User } from './user';

export interface Comment extends User {
  content: string;
  createdAt: string;
}
