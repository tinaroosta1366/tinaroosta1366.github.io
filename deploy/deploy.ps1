# Uploads the portfolio site to Sajad's server and swaps it in.
# Usage (from the repo folder):  powershell -ExecutionPolicy Bypass -File deploy\deploy.ps1
# Needs: Windows 10/11 built-in ssh, scp and tar (no extra install).

param(
    [string]$Server   = "188.212.97.59",
    [string]$User     = "tina-deploy",
    [string]$KeyPath  = "$env:USERPROFILE\.ssh\private-key-file.pem",
    [string]$RemoteDir = "/opt/tina-portfolio/site"
)

$ErrorActionPreference = "Stop"

# The repo root is the parent of this script's folder.
$repoRoot = Split-Path -Parent $PSScriptRoot
$archive  = Join-Path $env:TEMP "tina-portfolio-site.tar.gz"

if (-not (Test-Path $KeyPath)) {
    Write-Host "Private key not found: $KeyPath" -ForegroundColor Red
    exit 1
}

# 1) Copy the site files to a temp folder (no git history, no deploy script, no readme),
#    stamp css/js links with a version so browsers load the new files, then pack it.
#    The repo itself is not changed.
Write-Host "1/3 Packing site files..." -ForegroundColor Cyan
$stage = Join-Path $env:TEMP "tina-portfolio-stage"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
robocopy $repoRoot $stage /E /XD .git deploy /XF README.md CNAME .gitignore .nojekyll /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "copy to staging folder failed" }
$version = Get-Date -Format "yyyyMMddHHmmss"
$indexPath = Join-Path $stage "index.html"
$utf8 = New-Object System.Text.UTF8Encoding $false
$html = [System.IO.File]::ReadAllText($indexPath, $utf8)
$html = $html.Replace('href="css/style.css"', "href=`"css/style.css?v=$version`"").Replace('src="js/main.js"', "src=`"js/main.js?v=$version`"")
[System.IO.File]::WriteAllText($indexPath, $html, $utf8)
if (Test-Path $archive) { Remove-Item $archive -Force }
tar -czf $archive -C $stage .
if ($LASTEXITCODE -ne 0) { throw "tar failed" }

# 2) Upload the archive to the server's temp folder.
Write-Host "2/3 Uploading..." -ForegroundColor Cyan
scp -i $KeyPath -o StrictHostKeyChecking=accept-new $archive "${User}@${Server}:/tmp/tina-portfolio-site.tar.gz"
if ($LASTEXITCODE -ne 0) { throw "scp failed" }

# 3) Extract into a temp folder first, then replace the live folder's contents in one quick step.
#    Contents are replaced in place (not the folder itself), so it also works when nginx mounts this exact folder.
#    Only $RemoteDir is touched; nothing else on the server is changed.
Write-Host "3/3 Publishing on the server..." -ForegroundColor Cyan
$remoteScript = @'
# remote publish script
set -e
DIR="__DIR__"
NEW="$DIR.new"
rm -rf "$NEW"
mkdir -p "$NEW" "$DIR"
tar -xzf /tmp/tina-portfolio-site.tar.gz -C "$NEW"
find "$NEW" -type d -exec chmod 755 {} +
find "$NEW" -type f -exec chmod 644 {} +
find "$DIR" -mindepth 1 -delete
cp -a "$NEW"/. "$DIR"/
rm -rf "$NEW"
rm -f /tmp/tina-portfolio-site.tar.gz
echo "Published to $DIR"
'@
$remoteScript = $remoteScript.Replace("__DIR__", $RemoteDir).Replace("`r`n", "`n")
# Save the script as a file without a BOM, upload it and run it (piping can add a BOM that breaks bash).
$scriptFile = Join-Path $env:TEMP "tina-portfolio-publish.sh"
[System.IO.File]::WriteAllText($scriptFile, $remoteScript, (New-Object System.Text.UTF8Encoding $false))
scp -i $KeyPath $scriptFile "${User}@${Server}:/tmp/tina-portfolio-publish.sh"
if ($LASTEXITCODE -ne 0) { throw "scp of publish script failed" }
ssh -i $KeyPath "${User}@${Server}" "bash /tmp/tina-portfolio-publish.sh; rc=`$?; rm -f /tmp/tina-portfolio-publish.sh; exit `$rc"
if ($LASTEXITCODE -ne 0) { throw "remote publish failed" }

Remove-Item $archive, $scriptFile -Force
Remove-Item $stage -Recurse -Force
Write-Host "Done." -ForegroundColor Green
