export interface Comment {
  id: number;
  author: string;
  text: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  likes: number;
  comments: Comment[];
}

// Keeping this global in the module allows it to persist between local API calls
export const globalBlogPosts: Post[] = [
  {
    id: 1,
    title: 'Hello World from the Mock DB',
    content: 'This data is coming from your Next.js API layer!',
    author: 'admin',
    likes: 3,
    comments: [
      { id: 101, author: 'johndoe', text: 'First comment!' }
    ]
  }
];