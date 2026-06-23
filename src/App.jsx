import { useState } from "react"
import Upload from "./pages/Upload"
import Dashboard from "./pages/Dashboard"
import ReviewQueue from "./pages/ReviewQueue"
import Evidence from "./pages/Evidence"

const TABS = [
  { id: "upload", label: "Analyze Image", icon: "📷" },
  { id: "dashboard", label: "Analytics", icon: "📊" },
  { id: "review", label: "Review Queue", icon: "⚠️" },
]

export default function App() {
  const [tab, setTab] = useState("upload")
  const [selectedRecord, setSelectedRecord] = useState(null)

  if (selectedRecord) {
    return <Evidence recordId={selectedRecord} onBack={() => setSelectedRecord(null)} />
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1a1a2e", color: "white", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>🚦</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>
            TrafficVision AI
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>Automated violation detection · Privacy-by-design</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.5 }}>
          DPDP Act 2023 compliant
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "white", borderBottom: "1px solid #e9ecef", padding: "0 24px", display: "flex", gap: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: "14px 20px", border: "none", cursor: "pointer",
              background: "transparent", fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "#2563eb" : "#6b7280",
              borderBottom: tab === t.id ? "2px solid #2563eb" : "2px solid transparent",
              transition: "all 0.15s"
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
        {tab === "upload" && <Upload onRecordReady={(id) => setSelectedRecord(id)} />}
        {tab === "dashboard" && <Dashboard onSelectRecord={setSelectedRecord} />}
        {tab === "review" && <ReviewQueue onSelectRecord={setSelectedRecord} />}
      </div>
    </div>
  )
}
