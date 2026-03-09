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
        else {
            Write-Host "No process found listening on port $Port"
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

Write-Host "All matching dev processes stopped (if any were running)."

