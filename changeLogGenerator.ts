/** @format */

export interface ChangelogConfig {
  owner: string;
  repo: string;
  githubToken?: string;
  geminiApiKey: string;
}

// Minimal interfaces to replace 'any'
interface GithubPR {
  number: number;
  title: string;
  merged_at: string | null;
}

interface GithubCommit {
  commit: {
    message: string;
  };
}

export class ChangelogService {
  private readonly owner: string;
  private readonly repo: string;
  private readonly githubToken?: string;
  private readonly geminiApiKey: string;

  constructor(config: ChangelogConfig) {
    this.owner = config.owner;
    this.repo = config.repo;
    this.githubToken = config.githubToken;
    this.geminiApiKey = config.geminiApiKey;
  }

  /**
   * Generates a changelog based on the most recently merged Pull Request.
   */
  async generateForLastPR(branch: string = "main"): Promise<string> {
    const lastPR = await this.fetchLastMergedPR(branch);
    if (!lastPR) {
      throw new Error(`No merged Pull Requests found for branch: ${branch}`);
    }

    const commits = await this.fetchPRCommits(lastPR.number);
    if (!commits.length) {
      throw new Error(`No commits found in PR #${lastPR.number}`);
    }

    const commitMessages = commits
      .map((c) => `- ${c.commit.message.split("\n")[0]}`) // Use first line of commit message
      .join("\n");

    return await this.askGemini(commitMessages, lastPR.title);
  }

  private async fetchLastMergedPR(branch: string): Promise<GithubPR | null> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/pulls?state=closed&base=${branch}&per_page=10`;
    const res = await fetch(url, { headers: this.getGithubHeaders() });

    if (!res.ok) {
      const errorData: any = await res.json().catch(() => ({}));
      throw new Error(
        `GitHub API error: ${res.status} ${errorData.message || res.statusText}`,
      );
    }

    const data = (await res.json()) as GithubPR[];
    return data.find((pr) => pr.merged_at !== null) || null;
  }

  private async fetchPRCommits(prNumber: number): Promise<GithubCommit[]> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/pulls/${prNumber}/commits`;
    const res = await fetch(url, { headers: this.getGithubHeaders() });

    if (!res.ok) {
      throw new Error(`GitHub API commits error: ${res.statusText}`);
    }

    return (await res.json()) as GithubCommit[];
  }

  private async askGemini(messages: string, prTitle: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${this.geminiApiKey}`;

    const prompt = {
      contents: [
        {
          parts: [
            {
              text: `You are a technical lead. Create a concise Discord changelog for PR: "${prTitle}".
          Format: Use bold headers, bullet points, and emojis. 
          Categories: 🚀 Features, 🛠️ Fixes, 🧹 Others.
          Source Commits:
          ${messages}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.6, // Slightly lower for more consistent formatting
        maxOutputTokens: 800,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompt),
    });

    const data: any = await res.json();

    if (!res.ok) {
      throw new Error(
        `Gemini API error: ${data.error?.message || res.statusText}`,
      );
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!result) {
      // Handle potential safety block or empty response
      throw new Error(
        data.promptFeedback?.blockReason
          ? "Gemini blocked the response"
          : "Gemini returned empty content",
      );
    }

    return result.trim();
  }

  private getGithubHeaders() {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "Bun-Changelog-Service",
      "X-GitHub-Api-Version": "2022-11-28", // Best practice to include
    };
    if (this.githubToken) {
      headers["Authorization"] = `Bearer ${this.githubToken}`;
    }
    return headers;
  }
}
