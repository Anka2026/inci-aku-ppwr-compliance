# İnci Akü PPWR Compliance Suite

v1.0.0 — müşteri teslimatı için üretim ürünü.

Kontrollü PPWR teslimat setleri (salt okunur) + Workspace (resmi kaynak) + müşteri ZIP.

## Yerel çalıştırma

Geliştirme:

```bat
00_START_PPWR_YAZILIMI.cmd
```

- Arayüz: http://localhost:5173
- API: http://127.0.0.1:8791

Tek port (üretim):

```bat
00_START_PPWR_PRODUCTION.cmd
```

Yönetici hesabı ortam değişkenleriyle belirlenir (`INCI_PPWR_ADMIN_USER` / `INCI_PPWR_ADMIN_PASSWORD`).

## Render

1. Bu repoyu GitHub’a bağlayın.
2. Render Dashboard → **New Blueprint** → `render.yaml`.
3. Kalıcı disk `/data` (25 GB) otomatik bağlanır.
4. Teslimat ağacını diske kopyalayın:
   - `/data/delivery/01_STARTER_INDIVIDUAL_DELIVERY_REV00/…`
   - `/data/delivery/02_INDUSTRIAL_DELIVERY_REV00/…`
   - (container / component varsa aynı düzen)
5. Deploy sonrası sağlık: `/api/health`

İlk yönetici şifresi Render’da `INCI_PPWR_ADMIN_PASSWORD` olarak üretilir (Dashboard → Environment).

## Teslim kuralları

- Resmi teslimat setlerine yazılmaz.
- Her müşteri paketi **Word + PDF**.
- PDF: LibreOffice (Docker imajında yüklü).
- Web’de dosyalar tarayıcıya iner; görünür **İndir** bağlantısı vardır.
