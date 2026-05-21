export type BlogComment = {
  id: string;
  name: string;
  comment: string;
  createdAt: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  featuredImage: string;
  category: string;
  tags: string[];
  readTime: string;
  comments: BlogComment[];
};