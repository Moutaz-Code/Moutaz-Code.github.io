export type RepoMetadata = {
  fullName: string;
  url: string;
  description?: string;
  stars: number;
  forks: number;
  language?: string;
  updatedAt: string;
  homepage?: string;
};

export interface RepoMetadataService {
  getRepo(fullName: string): Promise<RepoMetadata | null>;
}
