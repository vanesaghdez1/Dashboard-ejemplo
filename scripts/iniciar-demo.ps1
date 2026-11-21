# Levanta la demo completa en local: PostgreSQL (Docker) + API .NET + frontend React.
# Uso: doble clic en iniciar-demo.cmd (raiz del repo), o:  powershell -File scripts\iniciar-demo.ps1
param(
    [switch]$NoBrowser  # no abrir el navegador al final
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Write-Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }

function Test-Url($url) {
    try { Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 2 | Out-Null; return $true } catch { return $false }
}

function Wait-Until($description, $timeoutSeconds, [scriptblock]$condition) {
    $deadline = (Get-Date).AddSeconds($timeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (& $condition) { return }
        Start-Sleep -Seconds 2
    }
    throw "Tiempo agotado esperando: $description"
}

function Test-Port($port) {
    [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

# Se usa cmd /c para silenciar la salida de docker: en Windows PowerShell 5, redirigir el
# stderr de un programa externo con ErrorActionPreference=Stop lanza un error falso.
function Test-DockerRunning { cmd /c 'docker info >nul 2>&1'; return $LASTEXITCODE -eq 0 }
function Get-DbHealth { cmd /c 'docker inspect -f "{{.State.Health.Status}}" dashboard-db 2>nul' }

# ---------- 1. Docker ----------
Write-Step 'Revisando Docker'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker no esta instalado. Instala Docker Desktop: https://www.docker.com/products/docker-desktop/'
}
if (-not (Test-DockerRunning)) {
    $dockerDesktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    Write-Host 'Docker Desktop no esta encendido; iniciandolo (puede tardar un minuto)...'
    Start-Process $dockerDesktop
    Wait-Until 'Docker Desktop' 180 { Test-DockerRunning }
}
Write-Host 'Docker listo.' -ForegroundColor Green

# ---------- 2. Base de datos ----------
Write-Step 'Levantando PostgreSQL'
Push-Location $root
cmd /c 'docker compose up -d db 2>&1'
Pop-Location
if ($LASTEXITCODE -ne 0) { throw 'No se pudo levantar PostgreSQL con docker compose.' }
Wait-Until 'PostgreSQL saludable' 90 { (Get-DbHealth) -eq 'healthy' }
Write-Host 'PostgreSQL listo en localhost:5432.' -ForegroundColor Green

# ---------- 3. API .NET ----------
Write-Step 'Iniciando API .NET (puerto 5080)'
if (Test-Port 5080) {
    Write-Host 'La API ya estaba corriendo.' -ForegroundColor Yellow
} else {
    Start-Process powershell -WindowStyle Minimized -WorkingDirectory (Join-Path $root 'backend') -ArgumentList @(
        '-NoExit', '-Command',
        "`$Host.UI.RawUI.WindowTitle = 'Demo - API .NET'; dotnet run --project src/Dashboard.Api --launch-profile http"
    )
}

# ---------- 4. Frontend ----------
Write-Step 'Iniciando frontend React (puerto 5173)'
$frontend = Join-Path $root 'frontend'
if (-not (Test-Path (Join-Path $frontend 'node_modules'))) {
    Write-Host 'Instalando dependencias del frontend (solo la primera vez)...'
    Push-Location $frontend
    npm install
    Pop-Location
}
if (Test-Port 5173) {
    Write-Host 'El frontend ya estaba corriendo.' -ForegroundColor Yellow
} else {
    Start-Process powershell -WindowStyle Minimized -WorkingDirectory $frontend -ArgumentList @(
        '-NoExit', '-Command',
        "`$Host.UI.RawUI.WindowTitle = 'Demo - Frontend React'; npm run dev"
    )
}

# ---------- 5. Esperar a que todo responda ----------
Write-Step 'Esperando a que la API y el frontend respondan'
Wait-Until 'API en http://localhost:5080/health' 180 { Test-Url 'http://localhost:5080/health' }
Write-Host 'API lista.' -ForegroundColor Green
Wait-Until 'frontend en http://localhost:5173' 120 { Test-Url 'http://localhost:5173' }
Write-Host 'Frontend listo.' -ForegroundColor Green

# ---------- 6. Listo ----------
Write-Host ''
Write-Host '================================================' -ForegroundColor Green
Write-Host '  Demo lista:   http://localhost:5173'            -ForegroundColor Green
Write-Host '  API (docs):   http://localhost:5080/scalar'     -ForegroundColor Green
Write-Host '================================================' -ForegroundColor Green
Write-Host '  Cuentas demo (contrasena: Demo123!)'
Write-Host '    Administrador  admin@ventasmx.demo'
Write-Host '    Gerente        gerente@ventasmx.demo'
Write-Host '    Vendedor       vendedor@ventasmx.demo'
Write-Host ''
Write-Host '  Para apagar todo: doble clic en detener-demo.cmd'
Write-Host ''

if (-not $NoBrowser) { Start-Process 'http://localhost:5173/login' }
