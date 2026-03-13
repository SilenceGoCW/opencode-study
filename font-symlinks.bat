@echo off
REM 该脚本处理字体文件为symlink的链接其他字体，就是将链接改为真正的字体文件，目的是为了解决windows系统不能自动识别链接文件的问题
setlocal EnableExtensions
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$dir = 'packages\ui\src\assets\fonts';" ^
  "if (!(Test-Path $dir)) { Write-Host ('missing dir: ' + $dir); exit 1 }" ^
  "Get-ChildItem $dir -Filter *.woff2 | ForEach-Object {" ^
  "  if ($_.Length -gt 200) { return }" ^
  "  $t = (Get-Content $_.FullName -TotalCount 1).Trim();" ^
  "  if ($t -notmatch '\.woff2$') { return }" ^
  "  $src = Join-Path $dir $t;" ^
  "  if (!(Test-Path $src)) { Write-Host ('missing target: ' + $src + ' (for ' + $_.Name + ')'); return }" ^
  "  Copy-Item $src $_.FullName -Force;" ^
  "  Write-Host ('fixed: ' + $_.Name + ' <- ' + $t);" ^
  "}"

echo.
echo Done. You can now restart: bun run --cwd packages/desktop dev
pause