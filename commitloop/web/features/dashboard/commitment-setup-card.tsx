import Link from "next/link";

export function CommitmentSetupCard() {
  return (
    <div className="card">
      <div className="label">Commitment</div>
      <p style={{ color: "var(--muted)" }}>
        <Link href="/settings">Connect a repo</Link> to track your streak.
      </p>
    </div>
  );
}
