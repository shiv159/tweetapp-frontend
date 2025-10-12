import { Comment } from './comment';
import { Likes } from './likes';

export interface Post {
  postId: string;
  content: string;
  userId: string;
  likes: Likes[];
  comments: Comment[];
  createdAt: string;
}
