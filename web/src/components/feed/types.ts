export type FeedProject = {
  id: string;
  title: string;
  summary: string;
  logoUrl?: string | null;
  image?: string | null;
  video?: string | null;
  githubUrl?: string | null;
  githubStarred?: boolean;
  createdAt: string;
  updatedAt: string;
  status?: string;
  tags?: string[];
  owner?: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
  };
};

export type FeedComment = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    username: string;
  };
};

export type FeedPost = {
  id: string;
  content: string;
  category?: string;
  quiz?: string | null;
  quizVotes?: Array<{ userId: string; optionIndex: number }>;
  myQuizVote?: { userId: string; optionIndex: number } | null;
  refUrls?: string[];
  image?: string | null;
  devlogMinutes?: number;
  createdAt: string;
  authorId: string;
  author?: {
    id: string;
    name: string;
    username: string;
    image?: string | null;
  };
  likes?: Array<{ id: string }>;
  comments?: FeedComment[];
  project?: {
    id: string;
    title: string;
  } | null;
};

export type FeedItem =
  | {
      type: "project";
      id: string;
      createdAt: string;
      project: FeedProject;
    }
  | {
      type: "post";
      id: string;
      createdAt: string;
      post: FeedPost;
    };
