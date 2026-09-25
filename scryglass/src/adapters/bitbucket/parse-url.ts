export type BitbucketEdition = "cloud" | "datacenter";

export type BitbucketPrRef = {
  edition: BitbucketEdition;
  host: string;
  workspace: string;
  repo: string;
  prId: string;
  htmlUrl: string;
};

const CLOUD_RE =
  /^https?:\/\/(?:www\.)?bitbucket\.org\/([^/]+)\/([^/]+)\/(?:pull-requests|pullrequests)\/(\d+)/i;

export function looksLikeBitbucketUrl(input: string): boolean {
  const trimmed = input.trim();
  return CLOUD_RE.test(trimmed) || /\/pull-requests\/\d+/i.test(trimmed);
}

export function parseBitbucketPrUrl(input: string): BitbucketPrRef {
  const trimmed = input.trim();
  const cloud = CLOUD_RE.exec(trimmed);
  if (cloud?.[1] && cloud[2] && cloud[3]) {
    return {
      edition: "cloud",
      host: "bitbucket.org",
      workspace: cloud[1],
      repo: cloud[2].replace(/\.git$/, ""),
      prId: cloud[3],
      htmlUrl: `https://bitbucket.org/${cloud[1]}/${cloud[2]}/pull-requests/${cloud[3]}`,
    };
  }

  const dcProjects =
    /^https?:\/\/([^/]+)\/projects\/([^/]+)\/repos\/([^/]+)\/pull-requests\/(\d+)/i.exec(trimmed);
  if (dcProjects?.[1] && dcProjects[2] && dcProjects[3] && dcProjects[4]) {
    return {
      edition: "datacenter",
      host: dcProjects[1],
      workspace: dcProjects[2],
      repo: dcProjects[3].replace(/\.git$/, ""),
      prId: dcProjects[4],
      htmlUrl: trimmed.split("?")[0] ?? trimmed,
    };
  }

  const dcShort = /^https?:\/\/([^/]+)\/([^/]+)\/([^/]+)\/pull-requests\/(\d+)/i.exec(trimmed);
  if (dcShort?.[1] && dcShort[2] && dcShort[3] && dcShort[4] && dcShort[1] !== "bitbucket.org") {
    return {
      edition: "datacenter",
      host: dcShort[1],
      workspace: dcShort[2],
      repo: dcShort[3].replace(/\.git$/, ""),
      prId: dcShort[4],
      htmlUrl: trimmed.split("?")[0] ?? trimmed,
    };
  }

  throw new Error(`Not a Bitbucket pull request URL: ${input}`);
}
