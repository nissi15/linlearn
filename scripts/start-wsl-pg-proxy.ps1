# Starts TCP proxy in WSL so Windows apps can reach Postgres (WSL Postgres listens on localhost only).
$ErrorActionPreference = "Stop"

function Get-WslArgs {
    $distros = @(wsl -l -q 2>$null | ForEach-Object { ($_ -replace "`0", "").Trim() } | Where-Object { $_ })
    if ($distros.Count -eq 0) {
        throw "No WSL distributions are installed. Install/start a WSL distro with PostgreSQL, or set DATABASE_URL to a reachable PostgreSQL server."
    }

    if ($env:WSL_DISTRO) {
        if ($distros -notcontains $env:WSL_DISTRO) {
            throw "WSL_DISTRO is set to '$env:WSL_DISTRO', but installed distributions are: $($distros -join ', ')."
        }
        return @("-d", $env:WSL_DISTRO)
    }

    return @()
}

function ConvertTo-WslPath([string]$WinPath) {
    $full = (Resolve-Path -LiteralPath $WinPath).Path
    if ($full -notmatch '^([A-Za-z]):\\(.*)$') { throw "Cannot map to WSL path: $full" }
    $drive = $Matches[1].ToLower()
    $rest = $Matches[2] -replace "\\", "/"
    return "/mnt/$drive/$rest"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$proxyPy = Join-Path $scriptDir "wsl-pg-proxy.py"
if (-not (Test-Path -LiteralPath $proxyPy)) {
    Write-Error "Missing $proxyPy"
}
$wslArgs = Get-WslArgs
$wslPath = ConvertTo-WslPath $proxyPy

$listening = & wsl @wslArgs -- bash -lc "ss -tlnp 2>/dev/null | grep -q ':5433 ' && echo yes || echo no" 2>$null
if ($listening -match "yes") {
    Write-Host "WSL Postgres proxy already listening on 5433."
} else {
    Start-Process wsl -ArgumentList ($wslArgs + @("--", "python3", $wslPath)) -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "Started WSL Postgres proxy (0.0.0.0:5433 -> 127.0.0.1:5432)."
}
$ipOutput = (& wsl @wslArgs -- hostname -I 2>$null) -replace "`0", ""
$ip = (($ipOutput.Trim()) -split "\s+")[0]
if (-not $ip) {
    throw "Could not determine the WSL IP address."
}
Write-Host "DATABASE_URL example: postgresql://postgres:postgres@${ip}:5433/linuxtutor"
