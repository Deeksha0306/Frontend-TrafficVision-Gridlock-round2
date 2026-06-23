import { useState, useRef } from "react"

const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

const TIER_STYLE = {
  AUTO_CHALLAN: { bg: "#fef2f2", border: "#fca5a5", color: "#dc2626", label: "Auto-challan issued" },
  REVIEW: { bg: "#fffbeb", border: "#fcd34d", color: "#d97706", label: "Sent to review queue" },
  DISMISSED: { bg: "#f0fdf4", border: "#86efac", color: "#16a34a", label: "Dismissed — insufficient evidence" },
}

const VTYPE_LABEL = {
  helmet_non_compliance: "No Helmet",
  triple_riding: "Triple Riding",
  plate_obscuration: "Plate Obscuration ⚡",
  stop_line_violation: "Stop Line Violation",
}

export default function Upload({ onRecordReady }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [cameraId, setCameraId] = useState("CAM-001")
  const [signalState, setSignalState] = useState("")
  const [stopLine, setStopLine] = useState("")
  const fileRef = useRef()

  async function processFile(file) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("camera_id", cameraId)
      if (signalState) form.append("signal_state", signalState)
      if (stopLine) form.append("stop_line_y_pct", parseFloat(stopLine))

      const res = await fetch(`${API}/api/analyze`, { method: "POST", body: form })
      if (!res.ok) throw new Error(await res.text())
      setResult(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const tier = result?.challan?.tier
  const tierStyle = TIER_STYLE[tier] || {}

  return (
    <div>
      {/* Camera context (RLVD architecture - differentiator ④) */}
      <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 20, border: "1px solid #e9ecef" }}>
        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14, color: "#374151" }}>
          📡 Camera / Signal Context <span style={{ fontSize: 12, fontWeight: 400, color: "#6b7280" }}>(RLVD architecture — optional)</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Camera ID</label>
            <input value={cameraId} onChange={e => setCameraId(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, width: 120 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Signal state</label>
            <select value={signalState} onChange={e => setSignalState(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, background: "white" }}>
              <option value="">-- not set --</option>
              <option value="red">🔴 Red</option>
              <option value="yellow">🟡 Yellow</option>
              <option value="green">🟢 Green</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>Stop line Y (0–1)</label>
            <input value={stopLine} onChange={e => setStopLine(e.target.value)}
              placeholder="e.g. 0.65" type="number" min="0" max="1" step="0.05"
              style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, width: 100 }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
          Signal state comes from the traffic controller hardware feed — not inferred from the image (see RLVD architecture design decision)
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#2563eb" : "#d1d5db"}`,
          borderRadius: 16, padding: "60px 24px", textAlign: "center",
          cursor: "pointer", transition: "all 0.15s",
          background: dragging ? "#eff6ff" : "white",
          marginBottom: 24
        }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
        <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>
          {loading ? "Analyzing image..." : "Drop traffic image here"}
        </div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>or click to browse · JPG, PNG</div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => e.target.files[0] && processFile(e.target.files[0])} />
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
          <div style={{ color: "#6b7280" }}>Running CV pipeline… preprocessing → detection → violations → ANPR</div>
        </div>
      )}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 16, color: "#dc2626" }}>
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div>
          {/* Challan tier banner (differentiator ③) */}
          <div style={{
            background: tierStyle.bg, border: `1px solid ${tierStyle.border}`,
            borderRadius: 12, padding: "16px 20px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 12
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: tierStyle.color, fontSize: 16 }}>
                {tierStyle.label}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                {result.challan?.reason}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: tierStyle.color }}>
                {Math.round((result.challan?.max_confidence || 0) * 100)}%
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>max confidence</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Evidence image */}
            <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e9ecef" }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Annotated evidence</div>
              {result.evidence_image_b64 ? (
                <img src={`data:image/jpeg;base64,${result.evidence_image_b64}`}
                  style={{ width: "100%", borderRadius: 8, border: "1px solid #e9ecef" }} alt="Evidence" />
              ) : <div style={{ color: "#9ca3af", fontSize: 13 }}>No image</div>}
              {result.quality?.bystanders_redacted > 0 && (
                <div style={{ fontSize: 12, color: "#059669", marginTop: 8 }}>
                  🔒 {result.quality.bystanders_redacted} bystander face(s) redacted before storage
                </div>
              )}
            </div>

            {/* Results */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Violations */}
              <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e9ecef" }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>
                  Violations detected ({result.violations?.length || 0})
                </div>
                {result.violations?.length === 0
                  ? <div style={{ color: "#6b7280", fontSize: 13 }}>None detected</div>
                  : result.violations.map((v, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 12px", background: "#fef2f2", borderRadius: 8, marginBottom: 6
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {VTYPE_LABEL[v.violation_type] || v.violation_type}
                      </span>
                      <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                        {Math.round(v.confidence * 100)}%
                      </span>
                    </div>
                  ))
                }
              </div>

              {/* Plates */}
              <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e9ecef" }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>
                  Number plates ({result.plates?.length || 0})
                </div>
                {result.plates?.length === 0
                  ? <div style={{ color: "#6b7280", fontSize: 13 }}>None read</div>
                  : result.plates.map((p, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, marginBottom: 6
                    }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15 }}>{p.plate_text}</span>
                      <span style={{ fontSize: 12, color: p.format_valid ? "#16a34a" : "#d97706" }}>
                        {p.format_valid ? "✓ Valid format" : "⚠ Format mismatch"}
                      </span>
                    </div>
                  ))
                }
              </div>

              {/* Quality */}
              <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #e9ecef" }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Image quality</div>
                <div style={{ fontSize: 13, color: "#6b7280", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span>Blur score: <strong>{result.quality?.blur_score}</strong></span>
                  <span>Brightness: <strong>{result.quality?.brightness}</strong></span>
                  <span>Quality flag: <strong style={{ color: result.quality?.quality_flag === "OK" ? "#16a34a" : "#d97706" }}>
                    {result.quality?.quality_flag}
                  </strong></span>
                </div>
              </div>

              <button onClick={() => onRecordReady(result.record_id)}
                style={{
                  padding: "12px 20px", background: "#2563eb", color: "white",
                  border: "none", borderRadius: 10, cursor: "pointer",
                  fontWeight: 600, fontSize: 14
                }}>
                View Full Evidence Record →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
