type SettingsRow = {
  label: string;
  value: string;
  action?: string | null;
};

export function SettingsDetails({ rows }: { rows: SettingsRow[] }) {
  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr auto",
            gap: "1rem",
            padding: "0.75rem 0",
            borderBottom: "1px solid var(--border)",
            alignItems: "center",
          }}
        >
          <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            {row.label}
          </span>
          <span>{row.value}</span>
          {row.action ? (
            <a href={row.action} target="_blank" rel="noreferrer">
              Open →
            </a>
          ) : (
            <span />
          )}
        </div>
      ))}
    </div>
  );
}
