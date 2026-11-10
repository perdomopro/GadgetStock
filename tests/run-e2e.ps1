# run-e2e.ps1 — PowerShell 7 Entry Point for GadgetStock E2E Test Suite
[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [int]$Tier,

    [Parameter(Mandatory=$false)]
    [string]$Feature,

    [Parameter(Mandatory=$false)]
    [string]$BackendUrl,

    [Parameter(Mandatory=$false)]
    [string]$FrontendUrl,

    [Parameter(Mandatory=$false)]
    [switch]$Offline,

    [Parameter(Mandatory=$false)]
    [switch]$VerboseOutput
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$runnerScript = Join-Path $scriptDir "runner.js"

if (-not (Test-Path $runnerScript)) {
    Write-Error "Runner script not found at $runnerScript"
    exit 1
}

$nodeArgs = @($runnerScript)

if ($PSBoundParameters.ContainsKey('Tier')) {
    $nodeArgs += "--tier=$Tier"
}

if ($PSBoundParameters.ContainsKey('Feature')) {
    $nodeArgs += "--feature=$Feature"
}

if ($PSBoundParameters.ContainsKey('BackendUrl')) {
    $nodeArgs += "--backend-url=$BackendUrl"
}

if ($PSBoundParameters.ContainsKey('FrontendUrl')) {
    $nodeArgs += "--frontend-url=$FrontendUrl"
}

if ($Offline.IsPresent) {
    $nodeArgs += "--offline"
}

if ($VerboseOutput.IsPresent) {
    $nodeArgs += "--verbose"
}

Write-Host "Starting GadgetStock E2E Test Suite via Node runner..." -ForegroundColor Cyan
& node $nodeArgs
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "E2E Test Suite completed successfully." -ForegroundColor Green
} else {
    Write-Host "E2E Test Suite reported failures (Exit code: $exitCode)." -ForegroundColor Red
}

exit $exitCode
