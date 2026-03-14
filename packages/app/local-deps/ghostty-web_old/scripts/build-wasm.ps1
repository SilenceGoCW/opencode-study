#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Get the directory where the script is located
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Join-Path $SCRIPT_DIR ".."

Write-Host "🔨 Building ghostty-vt.wasm..."

# Check for Zig
if (-not (Get-Command zig -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Zig not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Zig 0.15.2+:" -ForegroundColor Yellow
    Write-Host "  Windows: https://ziglang.org/download/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

$ZIG_VERSION = zig version
Write-Host "✓ Found Zig $ZIG_VERSION" -ForegroundColor Green

# Change to project root directory
Push-Location $PROJECT_ROOT

try {
    # Initialize/update submodule
    if (-not (Test-Path "ghostty\.git")) {
        Write-Host "📦 Initializing Ghostty submodule..."
        git submodule update --init --recursive
    } else {
        Write-Host "📦 Ghostty submodule already initialized"
    }

    # Apply patch
    Write-Host "🔧 Applying WASM API patch..."
    Push-Location ghostty

    try {
        git apply --check ..\patches\ghostty-wasm-api.patch
    } catch {
        Write-Host "❌ Patch doesn't apply cleanly" -ForegroundColor Red
        Write-Host "Ghostty may have changed. Check patches/ghostty-wasm-api.patch" -ForegroundColor Yellow
        Pop-Location
        Pop-Location
        exit 1
    }

    git apply ..\patches\ghostty-wasm-api.patch

    # Build WASM
    Write-Host "⚙️  Building WASM (takes ~20 seconds)..."
    zig build lib-vt -Dtarget=wasm32-freestanding -Doptimize=ReleaseSmall

    # Copy to project root
    Pop-Location
    Copy-Item "ghostty\zig-out\bin\ghostty-vt.wasm" "."

    # Revert patch to keep submodule clean
    Write-Host "🧹 Cleaning up..."
    Push-Location ghostty
    git apply -R ..\patches\ghostty-wasm-api.patch
    # Remove new files created by the patch
    Remove-Item "include\ghostty\vt\terminal.h" -ErrorAction SilentlyContinue
    Remove-Item "src\terminal\c\terminal.zig" -ErrorAction SilentlyContinue
    Pop-Location

    # Get file size
    $SIZE = (Get-Item "ghostty-vt.wasm").Length / 1KB
    $SIZE_FORMATTED = "{0:N2} KB" -f $SIZE
    Write-Host "✅ Built ghostty-vt.wasm ($SIZE_FORMATTED)" -ForegroundColor Green
} finally {
    # Always return to the original directory
    Pop-Location
}