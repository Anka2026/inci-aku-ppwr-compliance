import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  api,
  GapAssignment,
  GapScanResult,
  GapSuggestResult,
  GapSuggestion,
  GapWorkspace,
} from "../api";
import { isWebMode } from "../runtime";

export default function GapWizard() {
  const [workspace, setWorkspace] = useState<GapWorkspace | null>(null);
  const [scan, setScan] = useState<GapScanResult | null>(null);
  const [assignments, setAssignments] = useState<GapAssignment[]>([]);
  const [productCode, setProductCode] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [suggestResult, setSuggestResult] = useState<GapSuggestResult | null>(null);
  const [picked, setPicked] = useState<GapSuggestion | null>(null);
  const [activeGap, setActiveGap] = useState<string | null>(null);
  const [gapFilter, setGapFilter] = useState("");
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [w, a, s] = await Promise.all([
      api.gapsWorkspace(),
      api.gapsAssignments(),
      api.gapsScan("starter", 100),
    ]);
    setWorkspace(w);
    setAssignments(a.assignments);
    setScan(s);
  }

  useEffect(() => {
    refresh().catch((e) => setErr(String(e)));
  }, []);

  const filteredGaps = useMemo(() => {
    const gaps = scan?.gaps || [];
    const q = gapFilter.trim().toLowerCase();
    if (!q) return gaps;
    return gaps.filter(
      (g) =>
        g.product_code.toLowerCase().includes(q) ||
        (g.description || "").toLowerCase().includes(q) ||
        (g.form || "").toLowerCase().includes(q),
    );
  }, [scan, gapFilter]);

  async function onSuggest(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setOkMsg("");
    setPicked(null);
    setBusy(true);
    try {
      const r = await api.gapsSuggest(description, productCode || undefined);
      setSuggestResult(r);
      if (r.suggestions[0]) setPicked(r.suggestions[0]);
    } catch (ex) {
      setErr(String(ex));
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    if (!picked || !productCode.trim()) {
      setErr("Ürün kodu ve set seçimi gerekli");
      return;
    }
    setErr("");
    setOkMsg("");
    setBusy(true);
    try {
      await api.gapsSave({
        product_code: productCode.trim(),
        set_code: picked.set_code,
        description: description.trim(),
        note: note.trim(),
        form: suggestResult?.form,
      });
      setOkMsg(`Aday kaydedildi: ${productCode.trim()} → ${picked.set_code}`);
      await refresh();
    } catch (ex) {
      setErr(String(ex));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setErr("");
    try {
      await api.gapsDelete(id);
      await refresh();
    } catch (ex) {
      setErr(String(ex));
    }
  }

  function loadGap(g: { product_code: string; description: string }) {
    setProductCode(g.product_code);
    setDescription(g.description);
    setActiveGap(g.product_code);
    setSuggestResult(null);
    setPicked(null);
    setOkMsg("");
  }

  function loadAssignment(a: GapAssignment) {
    setProductCode(a.product_code);
    setDescription(a.description || "");
    setNote(a.note || "");
    setActiveGap(a.product_code);
    setSuggestResult(null);
    setPicked({
      set_code: a.set_code,
      peer_products: 0,
      bom_lines: 0,
      description: a.description,
    });
    setOkMsg("");
  }

  return (
    <section>
      <p className="eyebrow">Eksik ambalaj verisi</p>
      <h1>DATA REQUIRED</h1>
      <p className="lead">
        Ürün açıklamasına göre ambalaj seti önerir. Öneriyi kaydedin, ardından Aday Paket ile
        doküman üretin. Resmi teslimat setleri değişmez.
      </p>

      {workspace && !isWebMode() && (
        <div className="banner-safe">
          <strong>Aday çalışma alanı</strong>
          <button type="button" onClick={() => api.gapsOpenFolder().catch((e) => setErr(String(e)))}>
            Klasörü aç
          </button>
        </div>
      )}

      <div className="kpi-row kpi-row-3">
        <article className={`kpi ${scan && scan.count > 0 ? "warn" : ""}`}>
          <strong>{scan?.count ?? "—"}</strong>
          <span>Eksik ürün taraması</span>
        </article>
        <article className="kpi">
          <strong>{assignments.length}</strong>
          <span>Aday atama</span>
        </article>
        <article className="kpi pass">
          <strong>Korunur</strong>
          <span>Resmi teslimat setleri</span>
        </article>
      </div>

      <form className="gap-form" onSubmit={onSuggest}>
        <label>
          Ürün kodu
          <input
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            placeholder="örn. 1009999"
            required
          />
        </label>
        <label className="grow">
          Teknik açıklama
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="örn. AKÜ,C-FLAT,DK,200AH…"
            required
          />
        </label>
        <label>
          Not
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="isteğe bağlı" />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "…" : "Öner"}
        </button>
      </form>

      {err && <p className="error">{err}</p>}
      {okMsg && <p className="ok">{okMsg}</p>}

      {suggestResult && (
        <div className="detail" style={{ marginTop: "1rem" }}>
          <h2>Öneri · form {suggestResult.form}</h2>
          <p className="meta">
            {suggestResult.product_code || productCode} — peer frekansına göre en yakın setler
          </p>
          <ul className="suggest-list">
            {suggestResult.suggestions.map((s) => (
              <li key={s.set_code}>
                <label className={picked?.set_code === s.set_code ? "picked" : ""}>
                  <input
                    type="radio"
                    name="set"
                    checked={picked?.set_code === s.set_code}
                    onChange={() => setPicked(s)}
                  />
                  <span>
                    <strong>{s.set_code}</strong>
                    <span className="muted">
                      {" "}
                      · {s.peer_products} peer · tare {s.tare_kg ?? "—"} · BOM {s.bom_lines}
                    </span>
                    {s.description && <div className="muted">{s.description}</div>}
                  </span>
                </label>
                <Link to={`/bom/${encodeURIComponent(s.set_code)}`}>BOM</Link>
              </li>
            ))}
          </ul>
          {suggestResult.suggestions.length === 0 && (
            <p className="muted">Öneri bulunamadı — açıklamada form token kontrol edin.</p>
          )}
          <div className="engine-actions" style={{ marginTop: "0.75rem" }}>
            <button type="button" disabled={!picked || busy} onClick={() => void onSave()}>
              Aday olarak kaydet
            </button>
            {picked && productCode.trim() && (
              <Link
                className="btn-ghost"
                to={`/packs?code=${encodeURIComponent(productCode.trim())}&set=${encodeURIComponent(picked.set_code)}&desc=${encodeURIComponent(description.trim())}`}
                style={{ display: "inline-flex", alignItems: "center", padding: "0.55rem 0.9rem" }}
              >
                Aday Paket →
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="split" style={{ marginTop: "1.5rem" }}>
        <div>
          <h2 className="section-title">
            Master gap ({filteredGaps.length}
            {gapFilter ? `/${scan?.gaps.length || 0}` : ""})
          </h2>
          <form className="inline" style={{ marginBottom: "0.75rem" }} onSubmit={(e) => e.preventDefault()}>
            <input
              value={gapFilter}
              onChange={(e) => setGapFilter(e.target.value)}
              placeholder="Kod / form / açıklama…"
              aria-label="Gap filtresi"
            />
          </form>
          <ul className="key-list">
            {filteredGaps.map((g) => (
              <li key={g.product_code}>
                <button
                  type="button"
                  className={activeGap === g.product_code ? "picked-rev" : ""}
                  onClick={() => loadGap(g)}
                >
                  {g.product_code}
                  <span className="act-badge purple" style={{ marginLeft: "0.4rem" }}>
                    {g.form || "gap"}
                  </span>
                </button>
              </li>
            ))}
            {scan && scan.gaps.length === 0 && (
              <li>
                <p className="muted" style={{ padding: "0.75rem" }}>
                  Açık gap yok (starter zaten CONTROLLED). Yeni ürün için yukarıdaki formu kullanın.
                </p>
              </li>
            )}
            {scan && scan.gaps.length > 0 && filteredGaps.length === 0 && (
              <li>
                <p className="muted" style={{ padding: "0.75rem" }}>
                  Filtreyle eşleşen gap yok.
                </p>
              </li>
            )}
          </ul>
        </div>
        <div className="detail">
          <h2 className="section-title">Kayıtlı adaylar ({assignments.length})</h2>
          {assignments.length === 0 && <p className="muted">Henüz aday yok.</p>}
          <table className="data-table">
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Set</th>
                <th>Form</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => loadAssignment(a)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: "inherit",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <strong>{a.product_code}</strong>
                      <div className="muted">{a.description}</div>
                    </button>
                  </td>
                  <td>
                    <Link to={`/bom/${encodeURIComponent(a.set_code)}`}>{a.set_code}</Link>
                  </td>
                  <td>
                    <span className="act-badge">{a.form || "—"}</span>
                  </td>
                  <td>
                    <button type="button" className="btn-ghost" onClick={() => void onDelete(a.id)}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
