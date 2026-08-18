İnci Akü PPWR Yazılımı — workspace (source of truth)
Frozen Rev.00 deliveries under Inci_Aku_PPWR_PIMS are NEVER modified.
Revisions: Rev.00, Rev.01, …  Status: DRAFT | ISSUED | SUPERSEDED

Optional export (not source of truth):
  PPWR_WORKSPACE_ENGINE/
    00_CONTROL/INCI_PPWR_WORKSPACE_ENGINE.xlsx
    00_AC_DOCUMENT_ENGINE.cmd
    01_PRODUCTS/<code>/  → junction to products/<code>/revisions/<current>/
Open ONLY via 00_AC_DOCUMENT_ENGINE.cmd. Links: relative OPEN WORD / OPEN PDF.

Suppliers (PPWR tedarikçi yönetimi):
  suppliers/<id>/SUPPLIER.json
  suppliers/<id>/documents/   TDS | ANALYSIS | CERTIFICATE | OTHER
  suppliers/<id>/analyses/    auto text scan (PPWR signals)
  suppliers/<id>/LINKS.json   component links (master BOM)
