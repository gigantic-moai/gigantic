export type IssueStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Issue {
  id: string;
  key: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignedAgentId: string | null;
  dependsOn: string[] | null;
  p4Changelist: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ReviewStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested';

export interface Review {
  id: string;
  issueId: string;
  agentId: string;
  p4Changelist: number;
  status: ReviewStatus;
  diffData: unknown | null;
  createdAt: string;
  updatedAt: string;
}

export type ReviewCommentAuthor = 'human' | 'agent';

export interface ReviewComment {
  id: string;
  reviewId: string;
  authorType: ReviewCommentAuthor;
  authorAgentId: string | null;
  filePath: string;
  lineNumber: number;
  content: string;
  createdAt: string;
}
