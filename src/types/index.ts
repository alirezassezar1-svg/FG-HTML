export type Language = 'fa' | 'en';
export type Theme = 'dark' | 'light';
export type ConversionMode = 'browser' | 'github';

export type JobStatus =
  | 'idle'
  | 'reading'
  | 'processing'
  | 'uploading'
  | 'queued'
  | 'running'
  | 'completed'
  | 'error';

export interface ConversionJob {
  id: string;
  fileName: string;
  fileSize: number;
  status: JobStatus;
  mode: ConversionMode;
  progressMsg: string;
  progressPercent?: number;
  htmlBlobUrl?: string;
  htmlBlob?: Blob;
  htmlSize?: number;
  downloadName: string;
  reportText?: string;
  errorMsg?: string;
  createdAt: number;
  finishedAt?: number;
  strategy?: string;
}

export interface GitHubConfig {
  repo: string;
  token: string;
  defaultBranch?: string;
  isConnected: boolean;
  canWrite: boolean;
  statusMessage: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  updated_at: string;
  default_branch: string;
  html_url: string;
  language: string | null;
  size: number;
}

export interface OutputItem {
  id: string;
  title: string;
  htmlFile: string;
  reportFile: string;
  sizeMb: number;
  strategy: string;
  timestamp: string;
  description?: string;
}
