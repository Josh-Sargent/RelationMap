"use client";

type Props = {
  allDatabaseIds: string[];
  dbIdToName: Record<string, string>;
  databaseColors: Record<string, string>;
  enabledDbs: Set<string>;
  onToggle: (id: string) => void;
};

export function DatabaseTogglePanel({
  allDatabaseIds,
  dbIdToName,
  databaseColors,
  enabledDbs,
  onToggle,
}: Props) {
  if (allDatabaseIds.length === 0) return null;

  const enabledCount = allDatabaseIds.filter((id) => enabledDbs.has(id)).length;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        right: 24,
        transform: "translateY(-50%)",
        zIndex: 20,
        width: 188,
        background: "var(--panel-bg)",
        backdropFilter: "blur(14px)",
        border: "1px solid var(--border-default)",
        borderRadius: 12,
        boxShadow: "var(--shadow-md)",
        overflow: "hidden",
      }}
      className="animate-fade-up"
    >
      {/* Header */}
      <div style={{
        padding: "9px 14px 8px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.07em",
          color: "var(--text-faint)",
          textTransform: "uppercase",
        }}>
          Databases
        </span>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: enabledCount > 0 ? "var(--accent-gold)" : "var(--text-faint)",
          fontWeight: 400,
        }}>
          {enabledCount}/{allDatabaseIds.length}
        </span>
      </div>

      {/* Database rows */}
      <div style={{ padding: "5px 0" }}>
        {allDatabaseIds.map((id) => {
          const enabled = enabledDbs.has(id);
          const name = dbIdToName[id] ?? id;
          const color = databaseColors[name] ?? databaseColors[id] ?? "#888";

          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              title={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                width: "100%",
                padding: "6px 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {/* Color dot — bright when on, dim when off */}
              <span style={{
                flexShrink: 0,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: enabled ? color : "var(--border-default)",
                boxShadow: enabled ? `0 0 6px ${color}99` : "none",
                transition: "background 0.2s, box-shadow 0.2s",
              }} />

              {/* Name */}
              <span style={{
                fontFamily: "'Geist', sans-serif",
                fontSize: 12,
                color: enabled ? "var(--text-secondary)" : "var(--text-faint)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                transition: "color 0.2s",
                opacity: enabled ? 1 : 0.5,
              }}>
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div style={{
        padding: "5px 14px 8px",
        borderTop: "1px solid var(--border-subtle)",
      }}>
        <span style={{
          fontFamily: "'Geist', sans-serif",
          fontSize: 10,
          color: "var(--text-faint)",
          lineHeight: 1.4,
        }}>
          {enabledCount === 0
            ? "Click to load a database"
            : "Click to toggle visibility"}
        </span>
      </div>
    </div>
  );
}
