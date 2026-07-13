# Updates the hosted Auth recovery email template to use token_hash
# (avoids PKCE code_verifier failures when Gmail prefetches links).
#
# Usage:
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#   .\scripts\update-recovery-email-template.ps1

$ErrorActionPreference = "Stop"
$projectRef = "fntnxpwxuxtztyqoiika"
$repoRoot = Split-Path -Parent $PSScriptRoot
$templatePath = Join-Path $repoRoot "supabase\templates\recovery.html"

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Error "Set SUPABASE_ACCESS_TOKEN (Dashboard → Account → Access Tokens)."
}

if (-not (Test-Path $templatePath)) {
  Write-Error "Missing template at $templatePath"
}

$content = Get-Content -Raw -Path $templatePath

$uri = "https://api.supabase.com/v1/projects/$projectRef/config/auth"
$headers = @{
  Authorization = "Bearer $($env:SUPABASE_ACCESS_TOKEN)"
  "Content-Type" = "application/json"
}
$body = @{
  mailer_subjects_recovery = "Reset your Fourth Clover password"
  mailer_templates_recovery_content = $content
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Patch -Uri $uri -Headers $headers -Body $body | Out-Null
Write-Output "Recovery email template updated for project $projectRef"
