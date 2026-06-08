export function RepoLink({ repo }: { repo: { owner: string; name: string } }) {
  return (
    <a
      className="btn btn-ghost"
      href={`https://github.com/${repo.owner}/${repo.name}`}
      target="_blank"
      rel="noreferrer"
    >
      Open repo on GitHub →
    </a>
  );
}
