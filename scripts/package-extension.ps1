param(
  [string]$Version = "0.1.0"
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist'
$stage = Join-Path $dist 'application-assist'
$zipPath = Join-Path $dist ("application-assist-$Version.zip")

if (Test-Path $stage) {
  Remove-Item $stage -Recurse -Force
}

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

New-Item -ItemType Directory -Path $stage -Force | Out-Null

$includePaths = @(
  'manifest.json',
  'README.md',
  '.github',
  'assets',
  'src',
  'test-pages',
  'PRIVACY.md'
)

foreach ($relativePath in $includePaths) {
  $source = Join-Path $root $relativePath
  if (-not (Test-Path $source)) {
    continue
  }

  $destination = Join-Path $stage $relativePath
  Copy-Item $source $destination -Recurse -Force
}

Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zipPath -Force
Write-Output "Created $zipPath"