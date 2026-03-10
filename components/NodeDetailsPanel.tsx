import type { NodeDetail } from "@/lib/types";

type Props = {
  detail: NodeDetail | null;
  open: boolean;
  onClose: () => void;
};

export function NodeDetailsPanel({ detail, open, onClose }: Props) {
  const createdDate = detail
    ? new Date(detail.createdTime).toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const createdTime = detail
    ? new Date(detail.createdTime).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <aside
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 320,
        zIndex: 40,
        transform: open ? "translateX(0)" : "translateX(340px)",
        transition: "transform 0.35s cubic-bezier(0.32, 0, 0.15, 1)",
        display: "flex",
        flexDirection: "column",
        background: "var(--panel-bg)",
        backdropFilter: "blur(20px) saturate(1.4)",
        borderLeft: "1px solid var(--panel-border)",
        boxShadow: "var(--shadow-panel)",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "20px 20px 16px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            fontWeight: 400,
            color: "var(--text-faint)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}>
            Page Details
          </div>
          {detail ? (
            <h2 style={{
              margin: 0,
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.3,
              wordBreak: "break-word",
            }}>
              {detail.name}
            </h2>
          ) : (
            <div style={{
              height: 22,
              width: "70%",
              background: "var(--bg-overlay)",
              borderRadius: 4,
            }} />
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            border: "1px solid var(--border-default)",
            borderRadius: 7,
            background: "var(--bg-surface)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: 14,
            transition: "background 0.15s, color 0.15s",
            marginTop: 2,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-overlay)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-warm)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-surface)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
          }}
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {detail ? (
          <dl style={{ margin: 0 }}>
            {[
              { label: "Database", value: detail.databaseName },
              { label: "Created by", value: detail.createdBy },
              { label: "Date", value: createdDate },
              { label: "Time", value: createdTime },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  marginBottom: 18,
                  paddingBottom: 18,
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <dt style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--text-faint)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}>
                  {label}
                </dt>
                <dd style={{
                  margin: 0,
                  fontFamily: "'Geist', sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  color: "var(--text-primary)",
                  lineHeight: 1.5,
                }}>
                  {value ?? "—"}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div style={{ color: "var(--text-faint)", fontSize: 13, fontFamily: "'Geist', sans-serif", textAlign: "center", marginTop: 40 }}>
            Select a node to view details
          </div>
        )}
      </div>

      {/* Footer CTA */}
      {detail && (
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border-subtle)",
        }}>
          <a
            href={detail.notionUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "10px 16px",
              background: "var(--accent-warm)",
              color: "#fff",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "'Geist', sans-serif",
              textDecoration: "none",
              letterSpacing: "0.01em",
              transition: "background 0.15s, transform 0.1s",
              boxShadow: "0 2px 8px rgba(217, 119, 87, 0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent-rust)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent-warm)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open in Notion
          </a>

          {/* Notion icon hint */}
          <p style={{
            margin: "10px 0 0",
            textAlign: "center",
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: "var(--text-faint)",
          }}>
            Opens in your browser
          </p>
        </div>
      )}
    </aside>
  );
}
