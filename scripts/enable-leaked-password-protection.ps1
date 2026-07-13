# Enable HaveIBeenPwned leaked-password checks (Pro+).
# Requires a personal access token from https://supabase.com/dashboard/account/tokens
#
# Usage (PowerShell):
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#   .\scripts\enable-leaked-password-protection.ps1

$ErrorActionPreference = "Stop"
$projectRef = "fntnxpwxuxtztyqoiika"

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Error "Set SUPABASE_ACCESS_TOKEN first (Dashboard → Account → Access Tokens)."
}

$uri = "https://api.supabase.com/v1/projects/$projectRef/config/auth"
$headers = @{
  Authorization = "Bearer $($env:SUPABASE_ACCESS_TOKEN)"
  "Content-Type" = "application/json"
}
$body = @{ password_hibp_enabled = $true } | ConvertTo-Json

$response = Invoke-RestMethod -Method Patch -Uri $uri -Headers $headers -Body $body
Write-Output "password_hibp_enabled = $($response.password_hibp_enabled)"
