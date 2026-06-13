export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

export interface Photo {
  id: string;
  name: string;
  url: string;
  downloadUrl: string;
  size: number;
  path: string;
  type: string;
  dimensions?: { width: number; height: number };
  dateTaken?: string;
  camera?: string;
  aperture?: string;
  iso?: string;
  focalLength?: string;
  exposure?: string;
}

export interface RepoInfo {
  owner: string;
  repo: string;
  path: string;
  branch: string;
}
