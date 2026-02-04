param(
  [switch]$IncludeFrontend = $true
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

$services = @(
  "auth-service",
  "employee-service",
  "leave-service",
  "payroll-service",
  "recruitment-service",
  "training-kpi-service",
  "communication-service",
  "attendance-service",
  "api-gateway"
)

if ($IncludeFrontend) {
  $services += "frontend"
}

foreach ($svc in $services) {
  $svcPath = Join-Path $repoRoot $svc
  if (-not (Test-Path $svcPath)) {
    Write-Warning "Skip missing service: $svc"
    continue
  }
  Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoExit", "-Command", "npm run dev" `
    -WorkingDirectory $svcPath
}

Write-Host "Started dev processes for: $($services -join ', ')"


