"use client";

import { useEffect, useRef, useState } from "react";
import type { ShapeLayout } from "@/components/GraphCanvas";

type Props = {
  shape: ShapeLayout;
  onShapeChange: (s: ShapeLayout) => void;
  deepHighlight: boolean;
  onDeepHighlightChange: (v: boolean) => void;
  showCenterText: boolean;
  onShowCenterTextChange: (v: boolean) => void;
  centerTextOpacity: number;
  onCenterTextOpacityChange: (v: number) => void;
};

type NotionSettings = {
  notionToken: string;
  rootPages: string[];
};

const SHAPES: Array<{ id: ShapeLayout; label: string; description: string }> = [
  { id: "sphere", label: "Sphere", description: "Nodes distributed across a 3D sphere surface using Fibonacci spacing." },
  { id: "seven", label: "Seven", description: "Nodes arranged along the outline of a large 3D numeral seven." },
  { id: "horse", label: "Horse", description: "Nodes follow the skeletal silhouette of a horse." },
];

export function SettingsPanel({ shape, onShapeChange, deepHighlight, onDeepHighlightChange, showCenterText, onShowCenterTextChange, centerTextOpacity, onCenterTextOpacityChange }: Props) {
  const [open, setOpen] = useState(false);

  // Notion settings state
  const [notionToken, setNotionToken] = useState("");
  const [rootPages, setRootPages] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  // Load saved settings when panel opens
  useEffect(() => {
    if (!open) return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: NotionSettings) => {
        setNotionToken(data.notionToken ?? "");
        setRootPages(data.rootPages && data.rootPages.length > 0 ? data.rootPages : [""]);
      })
      .catch(() => {});
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleSave() {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notionToken, rootPages: rootPages.filter((p) => p.trim()) }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 2500);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setSyncStatus(`Synced — ${data.nodeCount} nodes, ${data.edgeCount} edges`);
        // Reload page to pick up new graph data
        setTimeout(() => window.location.reload(), 800);
      } else {
        setSyncStatus(`Error: ${data.error ?? "unknown"}`);
      }
    } catch {
      setSyncStatus("Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  function addRootPage() {
    setRootPages((p) => [...p, ""]);
  }

  function removeRootPage(i: number) {
    setRootPages((p) => p.filter((_, idx) => idx !== i));
  }

  function updateRootPage(i: number, value: string) {
    setRootPages((p) => p.map((v, idx) => (idx === i ? value : v)));
  }

  return (
    <>
      {/* Gear trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Settings"
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: `1px solid ${open ? "var(--accent-warm)" : "var(--border-default)"}`,
          background: open ? "var(--bg-overlay)" : "var(--panel-bg)",
          backdropFilter: "blur(12px)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: open ? "var(--text-primary)" : "var(--text-muted)",
          transition: "background 0.15s, color 0.15s, border-color 0.15s",
          boxShadow: "var(--shadow-sm)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--bg-overlay)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = open ? "var(--bg-overlay)" : "var(--panel-bg)";
          (e.currentTarget as HTMLElement).style.color = open ? "var(--text-primary)" : "var(--text-muted)";
        }}
      >
        ⚙
      </button>

      {/* Settings popup */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            bottom: 56,
            right: 24,
            zIndex: 50,
            width: 320,
            background: "var(--panel-bg)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-default)",
            borderRadius: 14,
            boxShadow: "var(--shadow-lg)",
            padding: "20px 0 4px",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {/* Header */}
          <div style={{ padding: "0 20px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{
              fontFamily: "'Geist', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}>
              Settings
            </span>
          </div>

          <div style={{ overflowY: "auto", maxHeight: "80vh", padding: "4px 0" }}>

            {/* ── Layout section ── */}
            <Section label="Layout">
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {SHAPES.map((s) => (
                  <ToggleRow
                    key={s.id}
                    label={s.label}
                    description={s.description}
                    checked={shape === s.id}
                    radio
                    onChange={() => onShapeChange(s.id)}
                  />
                ))}
              </div>
            </Section>

            <Divider />

            {/* ── Display section ── */}
            <Section label="Display">
              <ToggleRow
                label="Deep Highlight"
                description="When a node is selected, show its full connection web with distance-based opacity decay instead of just direct neighbours."
                checked={deepHighlight}
                onChange={(v) => onDeepHighlightChange(v)}
              />
              <ToggleRow
                label="Center Text"
                description="Show selected node text in the center of the sphere."
                checked={showCenterText}
                onChange={(v) => onShowCenterTextChange(v)}
              />
              <div style={{ marginTop: 10, padding: "8px 10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <p style={{ margin: 0, fontFamily: "'Geist', sans-serif", fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>
                    Center Text Opacity
                  </p>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--text-faint)" }}>
                    {Math.round(centerTextOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(centerTextOpacity * 100)}
                  onChange={(e) => onCenterTextOpacityChange(Number(e.target.value) / 100)}
                  style={{ width: "100%", accentColor: "var(--accent-warm)", cursor: "pointer" }}
                />
              </div>
            </Section>

            <Divider />

            {/* ── Notion section ── */}
            <Section label="Notion">
              <label style={labelStyle}>API Token</label>
              <input
                type="password"
                value={notionToken}
                onChange={(e) => setNotionToken(e.target.value)}
                placeholder="secret_..."
                style={inputStyle}
              />

              <label style={{ ...labelStyle, marginTop: 12 }}>Root Pages</label>
              <p style={hintStyle}>
                Paste Notion page URLs or IDs. Databases nested under each page will be synced.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {rootPages.map((page, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="text"
                      value={page}
                      onChange={(e) => updateRootPage(i, e.target.value)}
                      placeholder="https://notion.so/… or page ID"
                      style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                    />
                    {rootPages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRootPage(i)}
                        style={removeBtnStyle}
                        title="Remove"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addRootPage}
                style={addBtnStyle}
              >
                + Add page
              </button>

              {/* Save + Sync buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    ...primaryBtnStyle,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing}
                  style={{
                    ...secondaryBtnStyle,
                    opacity: syncing ? 0.6 : 1,
                  }}
                >
                  {syncing ? "Syncing…" : "Sync Now"}
                </button>
              </div>

              {saveStatus === "saved" && (
                <p style={{ ...statusStyle, color: "var(--accent-sage)" }}>Saved.</p>
              )}
              {saveStatus === "error" && (
                <p style={{ ...statusStyle, color: "var(--accent-warm)" }}>Failed to save.</p>
              )}
              {syncStatus && (
                <p style={{ ...statusStyle, color: syncStatus.startsWith("Error") ? "var(--accent-warm)" : "var(--accent-sage)" }}>
                  {syncStatus}
                </p>
              )}
            </Section>

          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "14px 20px" }}>
      <p style={{
        margin: "0 0 10px",
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--text-faint)",
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "var(--border-subtle)", margin: "0 20px" }} />;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  radio = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  radio?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: "100%",
        background: checked ? "var(--bg-overlay)" : "transparent",
        border: `1px solid ${checked ? "var(--border-default)" : "transparent"}`,
        borderRadius: 8,
        padding: "8px 10px",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.12s, border-color 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!checked) (e.currentTarget as HTMLElement).style.background = "var(--bg-surface)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = checked ? "var(--bg-overlay)" : "transparent";
      }}
    >
      {/* Indicator */}
      <div style={{
        flexShrink: 0,
        marginTop: 2,
        width: radio ? 14 : 28,
        height: radio ? 14 : 16,
        borderRadius: radio ? "50%" : 8,
        border: `1.5px solid ${checked ? "var(--accent-warm)" : "var(--border-default)"}`,
        background: checked ? "var(--accent-warm)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.12s, border-color 0.12s",
        position: "relative",
      }}>
        {radio && checked && (
          <div style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#fff",
          }} />
        )}
        {!radio && checked && (
          <span style={{ color: "#fff", fontSize: 10, lineHeight: 1, fontWeight: 700 }}>✓</span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0,
          fontFamily: "'Geist', sans-serif",
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text-primary)",
          lineHeight: 1.3,
        }}>
          {label}
        </p>
        <p style={{
          margin: "3px 0 0",
          fontFamily: "'Geist', sans-serif",
          fontSize: 11,
          color: "var(--text-faint)",
          lineHeight: 1.45,
        }}>
          {description}
        </p>
      </div>
    </button>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'Geist', sans-serif",
  fontSize: 11,
  fontWeight: 500,
  color: "var(--text-secondary)",
  marginBottom: 5,
};

const hintStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontFamily: "'Geist', sans-serif",
  fontSize: 11,
  color: "var(--text-faint)",
  lineHeight: 1.45,
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 10px",
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  color: "var(--text-primary)",
  background: "var(--bg-raised)",
  border: "1px solid var(--border-default)",
  borderRadius: 7,
  outline: "none",
  marginBottom: 0,
};

const removeBtnStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 22,
  height: 22,
  borderRadius: 6,
  border: "1px solid var(--border-default)",
  background: "transparent",
  color: "var(--text-muted)",
  fontSize: 16,
  lineHeight: "1",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

const addBtnStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "5px 10px",
  fontFamily: "'Geist', sans-serif",
  fontSize: 11,
  fontWeight: 500,
  color: "var(--text-secondary)",
  background: "transparent",
  border: "1px dashed var(--border-default)",
  borderRadius: 7,
  cursor: "pointer",
  width: "100%",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  fontFamily: "'Geist', sans-serif",
  fontSize: 12,
  fontWeight: 500,
  color: "#fff",
  background: "var(--accent-warm)",
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  fontFamily: "'Geist', sans-serif",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--text-primary)",
  background: "var(--bg-overlay)",
  border: "1px solid var(--border-default)",
  borderRadius: 7,
  cursor: "pointer",
};

const statusStyle: React.CSSProperties = {
  margin: "8px 0 0",
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
};
