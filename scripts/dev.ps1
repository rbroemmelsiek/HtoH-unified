param(
    [int[]]$PortsToFree = @(3000, 5001, 5003, 8080)
)

$ErrorActionPreference = "Stop"

function Stop-Port {
    param(
        [int]$Port
    )

    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($null -ne $connections) {
            $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($procId in $pids) {
                Write-Host "Stopping PID $procId listening on port $Port"
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    }
    catch {
        Write-Warning "Failed to inspect/stop processes on port ${Port}: $($_.Exception.Message)"
    }
}

Write-Host "Stopping dev servers on common ports: $($PortsToFree -join ', ')"
foreach ($port in $PortsToFree) {
    Stop-Port -Port $port
}

$root = Split-Path -Parent $PSScriptRoot

# Use same PowerShell executable as current process (pwsh or powershell)
$shellExe = (Get-Process -Id $PID).Path

Write-Host "Starting frontend (Next.js dev server)..."
$frontendCmd = "cd '$root/frontend'; npm run dev"
Start-Process $shellExe -ArgumentList "-NoExit", "-Command", $frontendCmd

if (Test-Path "$root/functions/package.json") {
    Write-Host "Starting backend (Firebase functions emulator)..."
    $functionsCmd = "cd '$root/functions'; npm run serve"
    Start-Process $shellExe -ArgumentList "-NoExit", "-Command", $functionsCmd
}
else {
    Write-Host "No backend found at '$root/functions' (skipping backend start)."
}

Write-Host ""
Write-Host "Dev environment started. Frontend and backend are running in separate PowerShell windows." -ForegroundColor Green
Write-Host ""
Write-Host "LOCAL URLs:" -ForegroundColor Cyan
Write-Host "  Frontend (Next.js):  http://localhost:3000"
Write-Host "  Functions emulator: http://127.0.0.1:5001"
Write-Host "  Emulator UI:         http://127.0.0.1:4000"
Write-Host ""
Write-Host "CLOUD (when deployed):" -ForegroundColor Cyan
Write-Host "  Frontend:   https://htoh-frontend--htoh-3-0.us-central1.hosted.app"
Write-Host "  Functions:  https://us-central1-htoh-3-0.cloudfunctions.net"
Write-Host "  (See Firebase Console for Auth, Firestore, Storage.)" -ForegroundColor DarkGray
Write-Host ""

