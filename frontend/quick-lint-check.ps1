# Quick ESLint Check Script
Set-Location "e:\lumina\confiido\frontend"
Write-Host "Running ESLint..." -ForegroundColor Yellow
npm run lint 2>&1 | Select-String "Error:|Warning:|info" | Out-File lint-check.txt
Get-Content lint-check.txt
Write-Host "`nResults saved to lint-check.txt" -ForegroundColor Cyan
