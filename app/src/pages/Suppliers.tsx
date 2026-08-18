import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  api,
  SupplierAnalysis,
  SupplierCard,
  SupplierDocument,
  SupplierLink,
} from "../api";
import { useLastDownload } from "../components/useLastDownload";
import { isWebMode } from "../runtime";
import { coverageLabel, docTypeLabel } from "../labels";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<SupplierCard[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [externalRef, setExternalRef] = useState("");
  const [contact, setContact] = useState("");
  const [materials, setMaterials] = useState("");
  const [note, setNote] = useState("");
  const [docs, setDocs] = useState<SupplierDocument[]>([]);
  const [links, setLinks] = useState<SupplierLink[]>([]);
  const [compQ, setCompQ] = useState("");
  const [compHits, setCompHits] = useState<
    { component_code: string; description: string; set_codes: string[]; set_count: number }[]
  >([]);
  const [analysis, setAnalysis] = useState<SupplierAnalysis | null>(null);
  const [docType, setDocType] = useState("TDS");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const { capture, LastDownloadBar } = useLastDownload();

  async function refresh(q = filter) {
    const r = await api.suppliersList(q);
    setSuppliers(r.suppliers);
  }

  useEffect(() => {
    refresh().catch((e) => setErr(String(e)));
  }, []);

  const filtered = useMemo(() => suppliers, [suppliers]);

  async function load(id: string) {
    setErr("");
    setOkMsg("");
    setAnalysis(null);
    const s = await api.suppliersGet(id);
    setSelectedId(s.id);
    setName(s.name);
    setCode(s.code || "");
    setCountry(s.country || "");
    setStatus(s.status || "ACTIVE");
    setExternalRef(s.external_ref || "");
    setContact(s.contact || "");
    setMaterials(s.materials || "");
    setNote(s.note || "");
    setDocs(s.documents || []);
    setLinks(s.links || []);
  }

  function clearForm() {
    setSelectedId(null);
    setName("");
    setCode("");
    setCountry("");
    setStatus("ACTIVE");
    setExternalRef("");
    setContact("");
    setMaterials("");
    setNote("");
    setDocs([]);
    setLinks([]);
    setCompHits([]);
    setCompQ("");
    setAnalysis(null);
    setFile(null);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setOkMsg("");
    try {
      const saved = await api.suppliersSave({
        name: name.trim(),
        code: code.trim(),
        country: country.trim(),
        status,
        external_ref: externalRef.trim(),
        contact: contact.trim(),
        materials: materials.trim(),
        note: note.trim(),
        id: selectedId || undefined,
      });
      setSelectedId(saved.id);
      setDocs(saved.documents || []);
      setLinks((saved as { links?: SupplierLink[] }).links || []);
      setOkMsg(`Kaydedildi: ${saved.name}`);
      await refresh();
    } catch (ex) {
      setErr(String(ex));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!selectedId) return;
    try {
      await api.suppliersDelete(selectedId);
      clearForm();
      await refresh();
    } catch (ex) {
      setErr(String(ex));
    }
  }

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || !file) return;
    setBusy(true);
    setErr("");
    setOkMsg("");
    try {
      const r = await api.suppliersUpload(selectedId, file, { doc_type: docType });
      setDocs(r.supplier.documents || []);
      setAnalysis(r.analysis);
      setOkMsg(`Yüklendi: ${r.document.title} · ${r.document.doc_type}`);
      setFile(null);
      await refresh();
    } catch (ex) {
      setErr(String(ex));
    } finally {
      setBusy(false);
    }
  }

  async function showAnalysis(doc: SupplierDocument) {
    if (!selectedId) return;
    setErr("");
    try {
      if (doc.analysis_id) {
        setAnalysis(await api.suppliersAnalysis(selectedId, doc.analysis_id));
      } else {
        setAnalysis(await api.suppliersAnalyze(selectedId, doc.id));
        await load(selectedId);
      }
    } catch (ex) {
      setErr(String(ex));
    }
  }

  return (
    <section>
      <p className="eyebrow">Tedarikçi · belgeler</p>
      <h1>Tedarikçi</h1>
      <p className="lead">
        TDS, analiz ve sertifika yükleyin. Bileşen bağlantıları{" "}
        <Link to="/components">bileşen matrisinde</Link> görünür.
      </p>

      <div className="split">
        <div>
          <h2 className="section-title">Tedarikçiler ({filtered.length})</h2>
          <label className="block-label">
            Ara
            <input
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                void refresh(e.target.value).catch((ex) => setErr(String(ex)));
              }}
              placeholder="isim / kod / ülke"
            />
          </label>
          <ul className="key-list">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={selectedId === s.id ? "picked-rev" : ""}
                  onClick={() => void load(s.id).catch((e) => setErr(String(e)))}
                >
                  {s.name}
                  <span
                    className={
                      s.readiness === "ready" || s.has_tds
                        ? "act-badge green"
                        : "act-badge purple"
                    }
                    style={{ marginLeft: "0.4rem" }}
                  >
                    {coverageLabel(s.readiness) || "—"}
                  </span>
                  <span className="muted">
                    {s.code ? ` · ${s.code}` : ""}
                    {s.has_tds ? " · TDS" : ""}
                    {s.link_count ? ` · ${s.link_count} bağ` : ""}
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li>
                <p className="muted" style={{ padding: "0.75rem" }}>
                  Henüz tedarikçi yok.
                </p>
              </li>
            )}
          </ul>
          <button type="button" style={{ marginTop: "0.75rem" }} onClick={clearForm}>
            Yeni tedarikçi
          </button>
          {!isWebMode() && (
            <button
              type="button"
              className="btn-ghost"
              style={{ marginLeft: "0.5rem" }}
              onClick={() => api.suppliersOpenFolder().catch((e) => setErr(String(e)))}
            >
              Klasör
            </button>
          )}
        </div>

        <div className="detail">
          <form onSubmit={onSave}>
            <label className="block-label">
              Tedarikçi adı
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <div className="pack-form" style={{ marginTop: 0 }}>
              <label>
                Kod
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SUP-…" />
              </label>
              <label>
                Ülke
                <input value={country} onChange={(e) => setCountry(e.target.value)} />
              </label>
              <label>
                Durum
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="ACTIVE">Aktif</option>
                  <option value="PENDING">Beklemede</option>
                  <option value="INACTIVE">Pasif</option>
                </select>
              </label>
            </div>
            <label className="block-label">
              ERP / dış referans
              <input value={externalRef} onChange={(e) => setExternalRef(e.target.value)} />
            </label>
            <label className="block-label">
              İletişim
              <input value={contact} onChange={(e) => setContact(e.target.value)} />
            </label>
            <label className="block-label">
              Malzeme kapsamı
              <input
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="ör. PE stretch, karton, palet"
              />
            </label>
            <label className="block-label">
              Not
              <input value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="engine-actions">
              <button type="submit" disabled={busy}>
                {busy ? "…" : "Kaydet"}
              </button>
              <button
                type="button"
                className="btn-ghost"
                disabled={!selectedId}
                onClick={() => void onDelete()}
              >
                Sil
              </button>
            </div>
          </form>

          {selectedId && (
            <div style={{ marginTop: "1rem" }}>
              <h3 className="section-title">Ambalaj bileşeni bağla</h3>
              <p className="meta">Master BOM’dan bileşen ara → tedarikçiye bağla (PPWR izlenebilirlik).</p>
              <div className="pack-form">
                <label className="grow">
                  Bileşen ara
                  <input
                    value={compQ}
                    onChange={(e) => setCompQ(e.target.value)}
                    placeholder="kod veya açıklama"
                  />
                </label>
                <button
                  type="button"
                  disabled={busy || !compQ.trim()}
                  onClick={() => {
                    setBusy(true);
                    api
                      .componentsSearch(compQ.trim())
                      .then((r) => setCompHits(r.components))
                      .catch((e) => setErr(String(e)))
                      .finally(() => setBusy(false));
                  }}
                >
                  Ara
                </button>
              </div>
              {compHits.length > 0 && (
                <ul className="key-list" style={{ marginTop: "0.5rem" }}>
                  {compHits.slice(0, 12).map((c) => (
                    <li key={c.component_code}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedId) return;
                          setBusy(true);
                          api
                            .suppliersLink(selectedId, {
                              component_code: c.component_code,
                              description: c.description,
                              set_code: c.set_codes[0] || "",
                              preferred: true,
                            })
                            .then((r) => {
                              setLinks(r.supplier.links || []);
                              setOkMsg(`Bağlandı: ${c.component_code}`);
                              setCompHits([]);
                              return refresh();
                            })
                            .catch((e) => setErr(String(e)))
                            .finally(() => setBusy(false));
                        }}
                      >
                        {c.component_code}
                        <span className="muted">
                          {" "}
                          · {c.description} · {c.set_count} set
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {links.length > 0 && (
                <ul className="file-list" style={{ marginTop: "0.75rem" }}>
                  {links.map((l) => (
                    <li key={l.id}>
                      <span>
                        {l.component_code} · {l.description || "—"}
                        {l.preferred ? " · tercih" : ""}
                        {l.set_code ? ` · ${l.set_code}` : ""}
                      </span>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() =>
                          api
                            .suppliersUnlink(selectedId, l.id)
                            .then(() => load(selectedId))
                            .then(() => refresh())
                            .catch((e) => setErr(String(e)))
                        }
                      >
                        Kopar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {selectedId && (
            <form onSubmit={onUpload} style={{ marginTop: "1rem" }}>
              <h3 className="section-title">TDS / Analiz yükle</h3>
              <div className="pack-form">
                <label>
                  Tür
                  <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                    <option value="TDS">TDS</option>
                    <option value="ANALYSIS">Analiz</option>
                    <option value="CERTIFICATE">Sertifika</option>
                    <option value="OTHER">Diğer</option>
                  </select>
                </label>
                <label className="grow">
                  Dosya (pdf/docx/xlsx)
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                <button type="submit" disabled={busy || !file}>
                  Yükle + analiz
                </button>
              </div>
            </form>
          )}

          {docs.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h3 className="section-title">Belgeler ({docs.length})</h3>
              <ul className="file-list">
                {docs.map((d) => (
                  <li key={d.id}>
                    <span>
                      {docTypeLabel(d.doc_type)} · {d.title}
                    </span>
                    <span>
                      <button
                        type="button"
                        onClick={() =>
                          api
                            .suppliersOpenDoc(selectedId!, d.id)
                            .then((r) => capture(r.download_url, "Belgeyi indir"))
                            .catch((e) => setErr(String(e)))
                        }
                      >
                        Aç / İndir
                      </button>{" "}
                      <button type="button" onClick={() => void showAnalysis(d)}>
                        Analiz
                      </button>{" "}
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() =>
                          api
                            .suppliersDeleteDoc(selectedId!, d.id)
                            .then(() => load(selectedId!))
                            .catch((e) => setErr(String(e)))
                        }
                      >
                        Sil
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis && (
            <div className="detail" style={{ marginTop: "1rem" }}>
              <h3 className="section-title">Analiz özeti</h3>
              <p className="meta">
                {analysis.title} · {analysis.language_guess} · {analysis.char_count} karakter ·{" "}
                {analysis.extract_ok ? "okundu" : "zayıf okuma"}
              </p>
              <p className="meta">
                PPWR sinyalleri:{" "}
                {(analysis.ppwr_signals || []).length
                  ? (analysis.ppwr_signals || []).join(", ")
                  : "—"}
              </p>
              {analysis.text_preview && (
                <p className="muted" style={{ whiteSpace: "pre-wrap" }}>
                  {analysis.text_preview}
                </p>
              )}
            </div>
          )}

          {err && <p className="error">{err}</p>}
          {okMsg && <p className="ok">{okMsg}</p>}
          <LastDownloadBar />
        </div>
      </div>
    </section>
  );
}
