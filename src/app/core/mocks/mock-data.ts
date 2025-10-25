import { Post } from '../../models/post';
import { Comment } from '../../models/comment';

const now = new Date();

export const MOCK_POSTS: Post[] = [
  {
    postId: 'post-1',
    userId: 'bob',
    content: "Hello world! This is the first mock post.",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    likes: [{ userId: 'jane', username: 'jane' }],
    comments: [
      {
        commentId: 'c1',
        userId: 'jane',
        username: 'jane',
        content: 'Nice post!',
        createdAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString() // 45 mins
      } as Comment
    ]
  },
  {
    postId: 'post-2',
    userId: 'alex',
    content: 'Another mock post for testing likes and comments.',
    createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    likes: [],
    comments: []
  }
];

export const MOCK_USERS = [
  { userId: 'bob', username: 'bob' },
  { userId: 'jane', username: 'jane' },
  { userId: 'alex', username: 'alex' },
  { userId: 'alan', username: 'alan' }
];
