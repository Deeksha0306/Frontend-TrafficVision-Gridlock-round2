import { useState, useEffect } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: "white", borderRadius: 12, padding: "20px 24px",
      border: "1px solid #e9ecef", textAlign: "center"
    }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: color || "#1a1a2e" }}>{value}</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function Dashboard({ onSelectRecord }) {
  const [stats, setStats] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/stats`).then(r => r.json()),
      fetch(`${API}/api/records?limit=20`).then(r => r.json()),
    ]).then(([s, r]) => { setStats(s); setRecords(r) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading analytics…</div>
  if (!stats) return <div style={{ textAlign: "center", padding: 60, color: "#dc2626" }}>Could not load stats</div>

  return (
    <div>
      {/* Summary metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="Images Processed" value={stats.total_images} />
        <StatCard label="Violations Found" value={stats.total_violations} color="#dc2626" />
        <StatCard label="Auto-challans Issued" value={stats.auto_challan} color="#dc2626" />
        <StatCard label="Pending Review" value={stats.review_queue} color="#d97706" />
      </div>

      {/* Privacy metric */}
      <div style={{
        background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12,
        padding: "12px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12
      }}>
        <span style={{ fontSize: 20 }}>🔒</span>
        <div>
          <span style={{ fontWeight: 600, color: "#16a34a" }}>{stats.bystanders_redacted} bystander faces</span>
          <span style={{ color: "#374151" }}> redacted from stored evidence · </span>
          <span style={{ fontWeight: 600, color: "#d97706" }}>{stats.appeals_pending} appeals</span>
          <span style={{ color: "#374151" }}> pending human review</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Violation breakdown */}
        <div style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid #e9ecef" }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Violations by type</div>
          {stats.by_type.length === 0
            ? <div style={{ color: "#9ca3af", fontSize: 13 }}>No violations yet</div>
            : stats.by_type.map(row => {
              const pct = stats.total_violations > 0 ? (row.count / stats.total_violations) * 100 : 0
              return (
                <div key={row.violation_type} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "#374151" }}>{row.violation_type.replace(/_/g, " ")}</span>
                    <span style={{ fontWeight: 600 }}>{row.count}</span>
                  </div>
                  <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#2563eb", borderRadius: 3 }} />
                  </div>
                </div>
              )
            })
          }
        </div>

        {/* Challan tier breakdown */}
        <div style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid #e9ecef" }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Enforcement outcome</div>
          {[
            { key: "auto_challan", label: "Auto-challan", color: "#dc2626", bg: "#fef2f2" },
            { key: "review_queue", label: "Human review", color: "#d97706", bg: "#fffbeb" },
            { key: "dismissed", label: "Dismissed", color: "#16a34a", bg: "#f0fdf4" },
          ].map(({ key, label, color, bg }) => (
            <div key={key} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", background: bg, borderRadius: 8, marginBottom: 8
            }}>
              <span style={{ fontSize: 14, color: "#374151" }}>{label}</span>
              <span style={{ fontSize: 20, fontWeight: 700, color }}>{stats[key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent records table */}
      <div style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid #e9ecef" }}>
        <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Recent records</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: "#9ca3af", textAlign: "left" }}>
              {["Record ID", "Timestamp", "Violations", "Tier", "Action"].map(h => (
                <th key={h} style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map(r => {
              const tierColor = { AUTO_CHALLAN: "#dc2626", REVIEW: "#d97706", DISMISSED: "#16a34a" }[r.challan_tier] || "#9ca3af"
              return (
                <tr key={r.record_id} style={{ borderBottom: "1px solid #f9fafb" }}>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#374151" }}>{r.record_id}</td>
                  <td style={{ padding: "10px 12px", color: "#6b7280" }}>{r.timestamp?.slice(0, 16)}</td>
                  <td style={{ padding: "10px 12px" }}> </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: tierColor, fontWeight: 600, fontSize: 12 }}>
                      {r.challan_tier || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <button onClick={() => onSelectRecord(r.record_id)}
                      style={{ padding: "4px 12px", fontSize: 12, background: "none", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", color: "#374151" }}>
                      View
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
