import { GitHubRepoMetadataService } from "../adapters/github/GitHubRepoMetadataService";
import type { RepoMetadataService } from "../domain/ports/RepoMetadataService";

export const repoService: RepoMetadataService =
  new GitHubRepoMetadataService();
