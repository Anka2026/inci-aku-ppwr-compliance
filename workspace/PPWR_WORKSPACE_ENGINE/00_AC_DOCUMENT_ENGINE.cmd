@echo off
cd /d "%~dp0"
echo ============================================================
echo  INCI AKU PPWR — WORKSPACE Document Engine (optional export)
echo  Source of truth is the software Workspace.
echo  Open ONLY via this CMD.
echo ============================================================
if not exist "00_CONTROL\INCI_PPWR_WORKSPACE_ENGINE.xlsx" (
  echo ERROR: engine missing: 00_CONTROL\INCI_PPWR_WORKSPACE_ENGINE.xlsx
  pause
  exit /b 1
)
start "" "00_CONTROL\INCI_PPWR_WORKSPACE_ENGINE.xlsx"
