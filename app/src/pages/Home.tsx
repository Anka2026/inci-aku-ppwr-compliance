import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ScopeInfo } from "../api";
import {
  actionBadge,
  actionLabel,
  eventCode,
  eventDetail,
  scopeLabel,
  type ActivityEvent,
} from "../labels";

function fmtNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("tr-TR").format(n);
}

const SCOPE_META: Record<string, { title: string; blurb: string; tone: string }> = {
  starter: {
    title: "STARTER",
    blurb: "Bireysel ambalaj · onaylı doküman seti",
    tone: "",
  },
  industrial: {
    title: "INDUSTRIAL",
    blurb: "Endüstriyel paketleme · seri üretim",
    tone: "purple",
  },
  container: {
    title: "CONTAINER",
    blurb: "Konteyner yükleme · sevkiyat konfigi",
    tone: "green",
  },
  component: {
    title: "COMPONENT",
    blurb: "Bileşen ve yedek parça varyantları",
    tone: "amber",
  },
};

export default function Home() {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  const [version, setVersion] = useState("");
  const [starterProducts, setStarterProducts] = useState<number | null>(null);
  const [starterSets, setStarterSets] = useState<number | null>(null);
  const [industrialProducts, setIndustrialProducts] = useState<number | null>(null);
  const [dataRequired, setDataRequired] = useState<number | null>(null);
  const [wsProducts, setWsProducts] = useState<number | null>(null);
  const [wsIssued, setWsIssued] = useState<number | null>(null);
  const [scopes, setScopes] = useState<ScopeInfo[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    api
      .health()
      .then((h) => {
        setOk(h.ok);
        setVersion(h.version || "");
      })
      .catch(() => setOk(false));

    api
      .mastersSummary()
      .then((s) => {
        setStarterProducts(s.starter?.products ?? null);
        setStarterSets(s.starter?.unique_sets ?? null);
        setIndustrialProducts(s.industrial?.products ?? null);
      })
      .catch(() => undefined);

    api
      .scopes()
      .then((r) => setScopes(r.scopes))
      .catch(() => undefined);

    api
      .gapsScan("starter", 500)
      .then((g) => setDataRequired(g.count ?? g.gaps?.length ?? 0))
      .catch(() => setDataRequired(null));

    api
      .wsStatus()
      .then((s) => {
        setWsProducts(s.products);
        setWsIssued(s.issued);
      })
      .catch(() => undefined);

    api
      .wsActivity(12)
      .then((a) => setEvents(a.events))
      .catch(() => setEvents([]));
  }, []);

  const quick = useMemo(
    () => [
      {
        to: "/search",
        title: "Ürün Arama",
        desc: "Ürün kodu ile dokümanları bulun",
        ico: "⌕",
        tone: "",
      },
      {
        to: "/bom",
        title: "Ambalaj BOM",
        desc: "Set kodu ile bileşen listesini açın",
        ico: "≡",
        tone: "purple",
      },
      {
        to: "/scopes",
        title: "Doküman Merkezi",
        desc: "Teknik dosya, beyan, etiket ve sevkiyat",
        ico: "▤",
        tone: "green",
      },
      {
        to: "/gaps",
        title: "Eksik Veri",
        desc: "Eksik ambalaj setini belirleyin",
        ico: "!",
        tone: "amber",
      },
      {
        to: "/workspace",
        title: "Revizyon Yönetimi",
        desc: "Revizyon, yayın ve tam paket",
        ico: "↻",
        tone: "",
      },
      {
        to: "/customers",
        title: "Müşteri Paketi",
        desc: "Kart, hazırlık özeti ve ZIP",
        ico: "▦",
        tone: "purple",
      },
    ],
    [],
  );

  const orderedScopes = useMemo(() => {
    const order = ["starter", "industrial", "container", "component"];
    return order
      .map((k) => scopes.find((s) => s.key === k))
      .filter(Boolean) as ScopeInfo[];
  }, [scopes]);

  return (
    <section>
      <div className="hero-panel">
        <div className="hero-copy">
          <img className="hero-brand-logo" src="/inci-aku-logo.png" alt="İnci Akü" />
          <p className="eyebrow">PPWR Compliance Suite</p>
          <h1>PPWR Compliance Suite</h1>
          <p className="lead">
            Ambalaj uygunluğu, teknik dosya ailesi ve ürün bazlı izlenebilirlik — tek platformda.
          </p>
          <div className="scope-row">
            <span className="badge">
              STARTER <strong>{fmtNum(starterProducts)}</strong> ürün
            </span>
            <span className="badge">
              INDUSTRIAL <strong>{fmtNum(industrialProducts)}</strong> ürün
            </span>
            <span className="badge">
              Revizyon <strong>{fmtNum(wsProducts)}</strong> · yayınlandı {fmtNum(wsIssued)}
            </span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden>
          <img src="/hero-battery.png" alt="" />
        </div>
      </div>

      <div className="section-head">
        <h2>Kapsamlar</h2>
        <Link to="/scopes">Doküman Merkezi →</Link>
      </div>
      <div className="scope-enter-grid">
        {orderedScopes.map((s) => {
          const m = SCOPE_META[s.key] || {
            title: s.key.toUpperCase(),
            blurb: "",
            tone: "",
          };
          return (
            <button
              key={s.key}
              type="button"
              className={`scope-enter-card ${m.tone}`}
              onClick={() => navigate(`/scopes/${s.key}`)}
            >
              <span className="scope-enter-label">{m.title}</span>
              <strong>{fmtNum(s.records)}</strong>
              <span className="muted">{m.blurb}</span>
              <span className="scope-enter-go">Aç ›</span>
            </button>
          );
        })}
      </div>

      <div className="kpi-row">
        <button type="button" className="kpi kpi-btn" onClick={() => navigate("/master")}>
          <div className="kpi-label">Kontrollü ürünler</div>
          <strong>{fmtNum(starterProducts)}</strong>
          <span>Starter master kapsamı</span>
        </button>
        <button type="button" className="kpi kpi-btn accent-purple" onClick={() => navigate("/bom")}>
          <div className="kpi-label">Ambalaj setleri</div>
          <strong>{fmtNum(starterSets)}</strong>
          <span>Starter fiziksel setler</span>
        </button>
        <button
          type="button"
          className={`kpi kpi-btn ${dataRequired && dataRequired > 0 ? "warn" : ""}`}
          onClick={() => navigate("/gaps")}
        >
          <div className="kpi-label">Eksik Veri</div>
          <strong>{fmtNum(dataRequired)}</strong>
          <span>Kapatılması gereken kayıt</span>
        </button>
        <button
          type="button"
          className={`kpi kpi-btn ${ok ? "pass" : "warn"}`}
          onClick={() => navigate("/workspace")}
        >
          <div className="kpi-label">Sistem</div>
          <strong>{ok ? "Hazır" : "Bağlantı yok"}</strong>
          <span>
            {ok ? "Sistem çalışıyor" : "Yeniden deneyin"}
            {version ? ` · v${version}` : ""}
          </span>
        </button>
      </div>

      <div className="section-head">
        <h2>Hızlı erişim</h2>
        <Link to="/workspace">Revizyon →</Link>
      </div>
      <div className="quick-grid">
        {quick.map((item) => (
          <Link key={item.to} to={item.to} className="quick-card">
            <span className={`quick-ico ${item.tone}`}>{item.ico}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
            <span className="quick-chevron">›</span>
          </Link>
        ))}
      </div>

      <div className="section-head">
        <h2>Doküman ailesi</h2>
        <Link to="/scopes">Doküman Merkezi →</Link>
      </div>
      <div className="doc-strip">
        <Link className="doc-chip" to="/scopes/starter?doc=01">
          <strong>Technical File</strong>
          <span>01 · Teknik dosya</span>
        </Link>
        <Link className="doc-chip" to="/scopes/starter?doc=02">
          <strong>EU DoC</strong>
          <span>02 · Uygunluk beyanı</span>
        </Link>
        <Link className="doc-chip" to="/scopes/starter?doc=03">
          <strong>Packaging Label</strong>
          <span>03 · Ambalaj etiketi</span>
        </Link>
        <Link className="doc-chip" to="/scopes/starter?doc=04">
          <strong>Shipment Statement</strong>
          <span>04 · Sevkiyat beyanı</span>
        </Link>
      </div>

      <div className="panel">
        <div className="section-head">
          <h2>Son işlemler</h2>
          <Link to="/workspace">Revizyon →</Link>
        </div>
        {events.length === 0 ? (
          <p className="muted">Henüz işlem kaydı yok. Ürün arama veya müşteri paketi ile başlayın.</p>
        ) : (
          <table className="activity-table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Açıklama</th>
                <th>İşlem</th>
                <th>Kapsam</th>
                <th>Tarih / Saat</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => {
                const code = eventCode(ev);
                const detail = eventDetail(ev);
                return (
                  <tr key={`${ev.at}-${i}`}>
                    <td>
                      {ev.product_code ? (
                        <Link to={`/search?q=${encodeURIComponent(String(ev.product_code))}&source=workspace`}>
                          <code>{code}</code>
                        </Link>
                      ) : ev.supplier_id ? (
                        <Link to="/suppliers">
                          <code>{code}</code>
                        </Link>
                      ) : ev.customer_id ? (
                        <Link to="/customers">
                          <code>{code}</code>
                        </Link>
                      ) : (
                        <code>{code}</code>
                      )}
                    </td>
                    <td>{detail}</td>
                    <td>
                      <span className={`act-badge ${actionBadge(String(ev.action))}`}>
                        {actionLabel(String(ev.action))}
                      </span>
                    </td>
                    <td className="muted">{scopeLabel(String(ev.scope || "workspace"))}</td>
                    <td className="muted">
                      {String(ev.at || "").slice(0, 19).replace("T", " ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
