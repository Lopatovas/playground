import type { FormEvent } from "react";

export function RepoSettingsForm({
  error,
  name,
  owner,
  saving,
  onNameChange,
  onOwnerChange,
  onSubmit,
}: {
  error: string | null;
  name: string;
  owner: string;
  saving: boolean;
  onNameChange: (name: string) => void;
  onOwnerChange: (owner: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Project repository</h2>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        CommitLoop tracks commits on this repo for your streak.
      </p>
      <form onSubmit={onSubmit}>
        <div className="repo-form__grid">
          <div className="field">
            <label htmlFor="owner">Owner</label>
            <input
              id="owner"
              value={owner}
              onChange={(e) => onOwnerChange(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="name">Repository</label>
            <input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              required
            />
          </div>
        </div>
        {error ? (
          <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>{error}</p>
        ) : null}
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save repository"}
        </button>
      </form>
    </div>
  );
}
