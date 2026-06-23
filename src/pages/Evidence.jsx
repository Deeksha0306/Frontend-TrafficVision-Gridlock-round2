import { useState, useEffect } from "react"

const API = import.meta.env.VITE_API_URL || "https://backend-trafficvision-gridlock-round2.onrender.com/"

const TIER_STYLE = {
  AUTO_CHALLAN: { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", label: "Auto-challan" },
  REVIEW: { color: "#d97706", bg: "#fffbeb", border: "#fcd34d", label: "Review required" },
  DISMISSED: { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", label: "Dismissed" },
}

export default function Evidence({ recordId, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [appealText, setAppealText] = useState("")
  const [appealResult, setAppealResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/records/${recordId}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [recordId])

  const submitAppeal = async () => {
    if (!appealText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/api/appeals/${recordId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: appealText })
      })
      setAppealResult(await res.json())
      setAppealText("")
    } catch (e) {
      setAppealResult({ message: "Error submitting appeal: " + e.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading record…</div>
  if (!data) return <div style={{ textAlign: "center", padding: 60, color: "#dc2626" }}>Record not found</div>

  const { record: r, violations, plates, appeals, evidence_image_b64 } = data
  const tier = TIER_STYLE[r.challan_tier] || {}

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1a1a2e", color: "white", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
          ← Back
        </button>
        <div style={{ fontWeight: 600, fontSize: 16 }}>Evidence Record</div>
        <div style={{ fontFamily: "monospace", opacity: 0.6, fontSize: 14 }}>{recordId}</div>
        <div style={{ marginLeft: "auto", background: tier.bg, color: tier.color, padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1px solid ${tier.border}` }}>
          {tier.label}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Evidence image */}
          <div>
            <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e9ecef", marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Annotated evidence image</div>
              {evidence_image_b64
                ? <img src={`data:image/jpeg;base64,${evidence_image_b64}`}
                    style={{ width: "100%", borderRadius: 8 }} alt="Evidence" />
                : <div style={{ color: "#9ca3af", fontSize: 13, padding: 20, textAlign: "center" }}>Image not available</div>
              }
              {r.bystanders_redacted > 0 && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "8px 12px", marginTop: 10, fontSize: 12, color: "#15803d" }}>
                  🔒 {r.bystanders_redacted} bystander face(s) redacted — DPDP Act data minimization
                </div>
              )}
            </div>

            {/* Image quality */}
            <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e9ecef" }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Image diagnostics</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  ["Blur score", r.blur_score],
                  ["Brightness", r.brightness],
                  ["Quality flag", r.quality_flag],
                  ["Timestamp", r.timestamp?.slice(0, 16)],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#374151", marginTop: 2 }}>{v ?? "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Challan tier */}
            <div style={{ background: tier.bg, border: `1px solid ${tier.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, color: tier.color, fontSize: 15 }}>{tier.label}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{r.challan_reason}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: tier.color, marginTop: 8 }}>
                {r.max_confidence != null ? `${Math.round(r.max_confidence * 100)}%` : "—"}
                <span style={{ fontSize: 13, fontWeight: 400, color: "#9ca3af", marginLeft: 6 }}>max confidence</span>
              </div>
            </div>

            {/* Violations */}
            <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e9ecef" }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Violations ({violations.length})</div>
              {violations.length === 0
                ? <div style={{ color: "#9ca3af", fontSize: 13 }}>None detected</div>
                : violations.map((v, i) => (
                  <div key={i} style={{ marginBottom: 10, padding: "10px 14px", background: "#fef2f2", borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                        {v.violation_type.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
                        {Math.round(v.confidence * 100)}%
                      </span>
                    </div>
                    {v.details_json && (() => {
                      try {
                        const d = JSON.parse(v.details_json)
                        return Object.entries(d).map(([k, val]) => (
                          <div key={k} style={{ fontSize: 11, color: "#6b7280" }}>{k}: {String(val)}</div>
                        ))
                      } catch { return null }
                    })()}
                  </div>
                ))
              }
            </div>

            {/* Plates */}
            <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e9ecef" }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Number plates ({plates.length})</div>
              {plates.length === 0
                ? <div style={{ color: "#9ca3af", fontSize: 13 }}>None read</div>
                : plates.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 16 }}>{p.plate_text}</span>
                    <span style={{ fontSize: 12, color: p.format_valid ? "#16a34a" : "#d97706" }}>
                      {p.format_valid ? "✓ Valid" : "⚠ Invalid format"}
                    </span>
                  </div>
                ))
              }
            </div>

            {/* Appeal section */}
            <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e9ecef" }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                Submit Appeal
                {appeals.length > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280", fontWeight: 400 }}>
                    ({appeals.length} submitted)
                  </span>
                )}
              </div>

              {appeals.map((a, i) => (
                <div key={i} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", marginBottom: 8, fontSize: 13 }}>
                  <div style={{ color: "#374151", marginBottom: 2 }}>{a.reason}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    {a.submitted_at?.slice(0, 16)} · Status: <strong>{a.status}</strong>
                  </div>
                </div>
              ))}

              {appealResult ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: 12, fontSize: 13, color: "#15803d" }}>
                  ✓ {appealResult.message}
                </div>
              ) : (
                <>
                  <textarea
                    value={appealText}
                    onChange={e => setAppealText(e.target.value)}
                    placeholder="Describe the reason for appeal (e.g. plate misread, incorrect vehicle identified, image too blurry for certainty...)"
                    style={{
                      width: "100%", minHeight: 80, padding: "10px 12px",
                      border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13,
                      resize: "vertical", boxSizing: "border-box", fontFamily: "inherit"
                    }}
                  />
                  <button onClick={submitAppeal} disabled={!appealText.trim() || submitting}
                    style={{
                      marginTop: 8, padding: "10px 20px", background: "#2563eb", color: "white",
                      border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14,
                      fontWeight: 600, opacity: !appealText.trim() ? 0.5 : 1, width: "100%"
                    }}>
                    {submitting ? "Submitting…" : "Submit Appeal"}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
