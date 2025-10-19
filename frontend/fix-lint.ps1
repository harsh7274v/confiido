# ESLint Auto-Fix Script for Confiido Frontend
# This script helps fix common lint errors

Write-Host "Starting ESLint auto-fix..." -ForegroundColor Green

# Change to frontend directory
Set-Location "e:\lumina\confiido\frontend"

# Run ESLint with auto-fix for fixable issues
Write-Host "`nRunning ESLint with --fix flag..." -ForegroundColor Yellow
npm run lint -- --fix

Write-Host "`n`nAuto-fix complete!" -ForegroundColor Green
Write-Host "Running lint again to check remaining issues..." -ForegroundColor Yellow

# Run lint again to see what's left
npm run lint

Write-Host "`n`nDone! Check output above for remaining errors." -ForegroundColor Cyan
