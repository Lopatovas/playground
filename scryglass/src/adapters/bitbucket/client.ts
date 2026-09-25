import { HttpError } from "../../foundry/http-error.js";
import { bitbucketHeaders } from "./auth.js";
import type { BitbucketConfig } from "./config.js";
import { classifyReachError, createBitbucketHttp } from "./network.js";
import type { BitbucketPrRef } from "./parse-url.js";
import type { PullRequest } from "../../domain/types.js";

export type BitbucketHttp = (url: string, init?: RequestInit) => Promise<Response>;

export type FetchedPr = PullRequest & {
  edition: BitbucketPrRef["edition"];
  workspace: string;
  repo: string;
};

export function createBitbucketClient(
  config: BitbucketConfig,
  http: BitbucketHttp = createBitbucketHttp(config),
) {
  const headers = bitbucketHeaders(config);

  const request = async (url: string, init?: RequestInit): Promise<unknown> => {
    let response: Response;
    try {
      response = await http(url, {
        ...init,
        headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
      });
    } catch (error) {
      throw new HttpError(503, classifyReachError(error, config.gitHost));
    }
    const text = await response.text();
    if (!response.ok) {
      throw new HttpError(
        response.status,
        `Bitbucket ${response.status} ${url}: ${text.slice(0, 300)}`,
      );
    }
    return text ? (JSON.parse(text) as unknown) : {};
  };

  return {
    async fetchPullRequest(ref: BitbucketPrRef): Promise<FetchedPr> {
      if (ref.edition === "cloud") {
        return fetchCloudPr(request, config, ref);
      }
      return fetchDcPr(request, config, ref);
    },
    async postPrComment(
      pr: FetchedPr,
      body: string,
      inline?: { file: string; line: number },
    ): Promise<string> {
      const url = commentUrl(config, pr);
      if (url.includes("/commit")) {
        throw new Error("Refusing to post a commit comment");
      }
      const payload =
        pr.edition === "cloud"
          ? {
              content: { raw: body },
              ...(inline ? { inline: { path: inline.file, to: inline.line } } : {}),
            }
          : {
              text: body,
              ...(inline
                ? { anchor: { path: inline.file, line: inline.line, lineType: "ADDED" } }
                : {}),
            };
      const created = (await request(url, {
        method: "POST",
        body: JSON.stringify(payload),
      })) as { id?: number | string };
      return String(created.id ?? "unknown");
    },
  };
}

export function commentUrl(config: BitbucketConfig, pr: FetchedPr): string {
  if (pr.edition === "cloud") {
    return `${config.apiBase}/repositories/${pr.workspace}/${pr.repo}/pullrequests/${pr.id}/comments`;
  }
  return `${config.apiBase}/rest/api/1.0/projects/${pr.workspace}/repos/${pr.repo}/pull-requests/${pr.id}/comments`;
}

async function fetchCloudPr(
  request: (url: string) => Promise<unknown>,
  config: BitbucketConfig,
  ref: BitbucketPrRef,
): Promise<FetchedPr> {
  const pr = (await request(
    `${config.apiBase}/repositories/${ref.workspace}/${ref.repo}/pullrequests/${ref.prId}`,
  )) as CloudPr;
  const changed = await listCloudChanged(request, config, ref);
  const clone =
    pickHttpsClone(pr.source?.repository?.links?.clone) ??
    `https://bitbucket.org/${ref.workspace}/${ref.repo}.git`;
  return {
    id: String(pr.id ?? ref.prId),
    host: "bitbucket-cloud",
    title: pr.title ?? `PR ${ref.prId}`,
    what: stripHtml(pr.description ?? pr.title ?? ""),
    changed,
    base: pr.destination?.commit?.hash ?? pr.destination?.branch?.name ?? "unknown",
    head: pr.source?.commit?.hash ?? pr.source?.branch?.name ?? "unknown",
    sourceBranch: pr.source?.branch?.name,
    destBranch: pr.destination?.branch?.name,
    htmlUrl: pr.links?.html?.href ?? ref.htmlUrl,
    cloneUrl: clone,
    edition: "cloud",
    workspace: ref.workspace,
    repo: ref.repo,
  };
}

async function listCloudChanged(
  request: (url: string) => Promise<unknown>,
  config: BitbucketConfig,
  ref: BitbucketPrRef,
): Promise<string[]> {
  const files = new Set<string>();
  let url: string | undefined =
    `${config.apiBase}/repositories/${ref.workspace}/${ref.repo}/pullrequests/${ref.prId}/diffstat?pagelen=100`;
  while (url) {
    const page = (await request(url)) as CloudDiffstat;
    for (const value of page.values ?? []) {
      const path = value.new?.path ?? value.old?.path;
      if (path) files.add(path);
    }
    url = page.next;
  }
  return [...files].sort();
}

async function fetchDcPr(
  request: (url: string) => Promise<unknown>,
  config: BitbucketConfig,
  ref: BitbucketPrRef,
): Promise<FetchedPr> {
  const pr = (await request(
    `${config.apiBase}/rest/api/1.0/projects/${ref.workspace}/repos/${ref.repo}/pull-requests/${ref.prId}`,
  )) as DcPr;
  const changed = await listDcChanged(request, config, ref);
  const clone =
    pickHttpsClone(
      (pr.fromRef?.repository?.links?.clone ?? []).map((item) => ({
        name: item.name,
        href: item.href,
      })),
    ) ?? `https://${ref.host}/scm/${ref.workspace}/${ref.repo}.git`;
  return {
    id: String(pr.id ?? ref.prId),
    host: "bitbucket-dc",
    title: pr.title ?? `PR ${ref.prId}`,
    what: pr.description ?? pr.title ?? "",
    changed,
    base: pr.toRef?.latestCommit ?? pr.toRef?.displayId ?? "unknown",
    head: pr.fromRef?.latestCommit ?? pr.fromRef?.displayId ?? "unknown",
    sourceBranch: pr.fromRef?.displayId,
    destBranch: pr.toRef?.displayId,
    htmlUrl: pr.links?.self?.[0]?.href ?? ref.htmlUrl,
    cloneUrl: clone,
    edition: "datacenter",
    workspace: ref.workspace,
    repo: ref.repo,
  };
}

async function listDcChanged(
  request: (url: string) => Promise<unknown>,
  config: BitbucketConfig,
  ref: BitbucketPrRef,
): Promise<string[]> {
  const files = new Set<string>();
  let start = 0;
  for (;;) {
    const page = (await request(
      `${config.apiBase}/rest/api/1.0/projects/${ref.workspace}/repos/${ref.repo}/pull-requests/${ref.prId}/changes?start=${String(start)}&limit=200`,
    )) as DcChanges;
    for (const value of page.values ?? []) {
      const path = value.path?.toString ?? value.path?.name;
      if (path) files.add(path);
    }
    if (page.isLastPage || page.nextPageStart === undefined) break;
    start = page.nextPageStart;
  }
  return [...files].sort();
}

function pickHttpsClone(links?: { name?: string; href?: string }[]): string | undefined {
  return links?.find((link) => link.name === "https" && link.href)?.href;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, "").trim();
}

type CloudPr = {
  id?: number;
  title?: string;
  description?: string;
  source?: {
    branch?: { name?: string };
    commit?: { hash?: string };
    repository?: { links?: { clone?: { name?: string; href?: string }[] } };
  };
  destination?: { branch?: { name?: string }; commit?: { hash?: string } };
  links?: { html?: { href?: string } };
};

type CloudDiffstat = {
  next?: string;
  values?: { new?: { path?: string }; old?: { path?: string } }[];
};

type DcPr = {
  id?: number;
  title?: string;
  description?: string;
  fromRef?: {
    displayId?: string;
    latestCommit?: string;
    repository?: { links?: { clone?: { name?: string; href?: string }[] } };
  };
  toRef?: { displayId?: string; latestCommit?: string };
  links?: { self?: { href?: string }[] };
};

type DcChanges = {
  isLastPage?: boolean;
  nextPageStart?: number;
  values?: { path?: { toString?: string; name?: string } }[];
};
