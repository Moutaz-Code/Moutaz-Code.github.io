import type {
  RepoMetadata,
  RepoMetadataService,
} from "../../domain/ports/RepoMetadataService";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

type CacheEntry = {
  data: RepoMetadata;
  fetchedAt: number;
};

type CacheFile = Record<string, CacheEntry>;

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export class GitHubRepoMetadataService implements RepoMetadataService {
  private readonly cachePath: string;
  private readonly ttl: number;

  constructor(ttl = TWELVE_HOURS) {
    // Resolve project root from this file's location (src/adapters/github/)
    const thisDir = dirname(fileURLToPath(import.meta.url));
    const projectRoot = join(thisDir, "..", "..", "..");
    this.cachePath = join(projectRoot, ".cache", "github-repos.json");
    this.ttl = ttl;
  }

  async getRepo(fullName: string): Promise<RepoMetadata | null> {
    const cache = this.readCache();
    const cached = cache[fullName];
    const now = Date.now();

    // Return fresh cache without fetching
    if (cached && now - cached.fetchedAt < this.ttl) {
      return cached.data;
    }

    // Try fetching fresh data
    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "astro-portfolio-build",
      };
      const token =
        // eslint-disable-next-line no-undef
        typeof process !== "undefined" ? process.env.GITHUB_TOKEN : undefined;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(
        `https://api.github.com/repos/${fullName}`,
        { headers },
      );

      if (!res.ok) {
        // Non-200: return stale cache if available
        return cached?.data ?? null;
      }

      const json = await res.json();
      const data: RepoMetadata = {
        fullName: json.full_name,
        url: json.html_url,
        description: json.description ?? undefined,
        stars: json.stargazers_count ?? 0,
        forks: json.forks_count ?? 0,
        language: json.language ?? undefined,
        updatedAt: json.updated_at ?? json.pushed_at ?? "",
        homepage: json.homepage || undefined,
      };

      cache[fullName] = { data, fetchedAt: now };
      this.writeCache(cache);

      return data;
    } catch {
      // Network error: return stale cache if available
      return cached?.data ?? null;
    }
  }

  private readCache(): CacheFile {
    try {
      if (existsSync(this.cachePath)) {
        return JSON.parse(readFileSync(this.cachePath, "utf-8"));
      }
    } catch {
      // Corrupted cache — start fresh
    }
    return {};
  }

  private writeCache(cache: CacheFile): void {
    try {
      const dir = dirname(this.cachePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.cachePath, JSON.stringify(cache, null, 2), "utf-8");
    } catch {
      // Cache write failure is non-fatal
    }
  }
}
