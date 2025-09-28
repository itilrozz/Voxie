// types/index.ts
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorEmail: string;
  createdAt: any; // Firebase Timestamp
  updatedAt?: any; // Firebase Timestamp
}

export interface Comment {
  id: string;
  text: string;
  authorId: string | null;
  authorEmail: string;
  createdAt: any; // Firebase Timestamp
}

export interface InputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  style?: any;
}

export interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string, postTitle: string) => void;
  showActions?: boolean;
}

export interface CommentCardProps {
  comment: Comment;
}
