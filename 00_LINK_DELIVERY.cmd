@echo off
cd /d "%~dp0"
set "DST=%~dp0delivery"
set "SRC="

if exist "C:\Users\burcu\Documents\YAZILIM\Inci_Aku_PPWR_PIMS\output\01_STARTER_INDIVIDUAL_DELIVERY_REV00" (
  set "SRC=C:\Users\burcu\Documents\YAZILIM\Inci_Aku_PPWR_PIMS\output"
)
if not defined SRC if exist "C:\Users\sozmen\Desktop\EU Packaging and Packaging Waste Regulation\Güncel sistem_20260818\01_STARTER_INDIVIDUAL_DELIVERY_REV00" (
  set "SRC=C:\Users\sozmen\Desktop\EU Packaging and Packaging Waste Regulation\Güncel sistem_20260818"
)
if not defined SRC (
  echo Kaynak yok: teslimat setleri bulunamadi.
  echo Beklenen: Inci_Aku_PPWR_PIMS\output veya Guncel sistem_20260818
  exit /b 1
)

mkdir "%DST%" 2>nul
for %%D in (
  01_STARTER_INDIVIDUAL_DELIVERY_REV00
  02_INDUSTRIAL_DELIVERY_REV00
  03_CONTAINER_DELIVERY_REV00
  04_COMPONENT_SPARE_DELIVERY_REV00
) do (
  if exist "%DST%\%%D" rmdir "%DST%\%%D" 2>nul
  if not exist "%DST%\%%D" (
    mklink /J "%DST%\%%D" "%SRC%\%%D"
  )
)
echo Teslimat setleri programa baglandi.
echo Kaynak: %SRC%
dir /AL "%DST%"
