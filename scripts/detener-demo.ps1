# Apaga la demo: cierra la API y el frontend, y detiene PostgreSQL (los datos se conservan).
param(
    [switch]$KeepDatabase  # dejar PostgreSQL encendido
)

$root = Split-Path -Parent $PSScriptRoot

function Stop-Port($port, $name) {
    $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $listeners) { Write-Host "$name no estaba corriendo."; return }
    foreach ($l in $listeners) {
        # El proceso que escucha el puerto, y la ventana de PowerShell que lo lanzo
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $($l.OwningProcess)" -ErrorAction SilentlyContinue
        Stop-Process -Id $l.OwningProcess -Force -ErrorAction SilentlyContinue
        if ($proc) {
            $parent = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.ParentProcessId)" -ErrorAction SilentlyContinue
            if ($parent -and $parent.CommandLine -like '*Demo - *') { Stop-Process -Id $parent.ProcessId -Force -ErrorAction SilentlyContinue }
        }
    }
    Write-Host "$name detenido." -ForegroundColor Green
}

Stop-Port 5080 'API .NET'
Stop-Port 5173 'Frontend React'
# dotnet run deja un proceso "Dashboard.Api" aparte del que escucha el puerto en algunos casos
Get-Process Dashboard.Api -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*Demo - API .NET*' -or $_.CommandLine -like '*Demo - Frontend React*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

if (-not $KeepDatabase) {
    Push-Location $root
    cmd /c 'docker compose stop db >nul 2>&1'
    Pop-Location
    Write-Host 'PostgreSQL detenido (los datos se conservan).' -ForegroundColor Green
}
