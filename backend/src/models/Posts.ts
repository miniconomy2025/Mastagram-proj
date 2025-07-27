//used to emulate the document d=structure for a post in typescript
export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  tags: string[];
}

export interface CreatePostData {
  title: string;
  content: string;
  author: string;
  tags?: string[];
  published?: boolean;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  author?: string;
  tags?: string[];
  published?: boolean;
}
