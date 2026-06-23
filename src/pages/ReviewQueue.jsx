import { useState, useEffect } from "react"

const API = import.meta.env.VITE_API_URL || "https://backend-trafficvision-gridlock-round2.onrender.com"

export default function ReviewQueue({ onSelectRecord }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("REVIEW")

  const loadRecords = (tier) => {
    setLoading(true)
    fetch(`${API}/api/records?tier=${tier}&limit=30`)
      .then(r => r.json())
      .then(setRecords)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRecords(activeTab) }, [activeTab])

  const TABS = [
    { id: "REVIEW", label: "Needs review", color: "#d97706", bg: "#fffbeb" },
    { id: "AUTO_CHALLAN", label: "Auto-challans", color: "#dc2626", bg: "#fef2f2" },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#1a1a2e", marginBottom: 4 }}>Review Queue</div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          Records below the auto-challan confidence threshold require human review before enforcement action.
          All auto-challans can be appealed and will appear here.
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 20px", borderRadius: 8, cursor: "pointer",
              fontWeight: activeTab === t.id ? 600 : 400,
              background: activeTab === t.id ? t.bg : "#f3f4f6",
              color: activeTab === t.id ? t.color : "#6b7280",
              border: activeTab === t.id ? `1px solid ${t.color}` : "1px solid transparent",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading…</div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 12, border: "1px solid #e9ecef", color: "#9ca3af" }}>
          No records in this queue
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {records.map(r => (
            <RecordCard key={r.record_id} record={r} onSelect={onSelectRecord} />
          ))}
        </div>
      )}
    </div>
  )
}

function RecordCard({ record: r, onSelect }) {
  const tierColor = { AUTO_CHALLAN: "#dc2626", REVIEW: "#d97706" }[r.challan_tier] || "#6b7280"
  const conf = r.max_confidence != null ? `${Math.round(r.max_confidence * 100)}%` : "—"

  return (
    <div style={{
      background: "white", borderRadius: 12, padding: "16px 20px",
      border: "1px solid #e9ecef", display: "flex", alignItems: "center", gap: 16
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%", background: tierColor, flexShrink: 0
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "monospace", fontSize: 13, color: "#374151", marginBottom: 2 }}>
          {r.record_id}
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>{r.timestamp?.slice(0, 16)} · {r.source_image?.split("/").pop()}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{r.challan_reason}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: tierColor }}>{conf}</div>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>confidence</div>
      </div>
      <button onClick={() => onSelect(r.record_id)}
        style={{
          padding: "8px 16px", background: "#2563eb", color: "white",
          border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600
        }}>
        Review →
      </button>
    </div>
  )
}