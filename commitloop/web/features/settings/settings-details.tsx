type SettingsRow = {
  label: string;
  value: string;
  action?: string | null;
};

export function SettingsDetails({ rows }: { rows: SettingsRow[] }) {
  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      {rows.map((row) => (
        <div key={row.label} className="settings-row">
          <span className="settings-row__label">{row.label}</span>
          <span className="settings-row__value">{row.value}</span>
          {row.action ? (
            <a
              className="settings-row__action"
              href={row.action}
              target="_blank"
              rel="noreferrer"
            >
              Open →
            </a>
          ) : (
            <span className="settings-row__action" />
          )}
        </div>
      ))}
    </div>
  );
}
