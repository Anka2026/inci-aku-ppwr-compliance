@echo off
cd /d "%~dp0"
echo ============================================================
echo  INCI AKU PPWR — CANDIDATE Document Engine
echo  Frozen Rev.00 deliveries are NOT modified.
echo  Open ONLY via this CMD (engine lives in 00_CONTROL).
echo ============================================================
if not exist "00_CONTROL\INCI_PPWR_CANDIDATE_ENGINE_Rev00.xlsx" (
  echo ERROR: engine missing: 00_CONTROL\INCI_PPWR_CANDIDATE_ENGINE_Rev00.xlsx
  pause
  exit /b 1
)
start "" "00_CONTROL\INCI_PPWR_CANDIDATE_ENGINE_Rev00.xlsx"
