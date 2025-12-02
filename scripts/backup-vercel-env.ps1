# Script PowerShell de sauvegarde des variables d'environnement Vercel
# Usage: .\scripts\backup-vercel-env.ps1

Write-Host "💾 Sauvegarde de la configuration Vercel..." -ForegroundColor Cyan

# Vérifier si Vercel CLI est installé
$vercelCmd = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelCmd) {
    Write-Host "❌ Vercel CLI n'est pas installé" -ForegroundColor Red
    Write-Host "📦 Installation: npm i -g vercel" -ForegroundColor Yellow
    exit 1
}

# Créer le dossier de backup s'il n'existe pas
if (-not (Test-Path "backups")) {
    New-Item -ItemType Directory -Path "backups" | Out-Null
}

# Date pour le nom du fichier
$date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "backups\vercel-env-backup-$date.txt"

Write-Host "📝 Export des variables d'environnement..." -ForegroundColor Cyan
vercel env ls | Out-File -FilePath $backupFile -Encoding UTF8

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sauvegarde créée: $backupFile" -ForegroundColor Green
    Write-Host "📊 Contenu:" -ForegroundColor Cyan
    Get-Content $backupFile
} else {
    Write-Host "❌ Erreur lors de la sauvegarde" -ForegroundColor Red
    exit 1
}

