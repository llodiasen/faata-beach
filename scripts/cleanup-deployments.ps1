# Script pour supprimer tous les deploiements Vercel sauf les 2 plus recents

Write-Host "Recuperation de la liste des deploiements..." -ForegroundColor Cyan
Write-Host ""

# Recuperer la liste des deploiements
$output = vercel ls 2>&1 | Out-String

# Parser les URLs des deploiements
$deployments = @()
$lines = $output -split "`n"

foreach ($line in $lines) {
    if ($line -match "(https://[a-zA-Z0-9-]+-ams-projects-[a-zA-Z0-9]+\.vercel\.app)") {
        $url = $matches[1]
        if ($url -and $deployments -notcontains $url) {
            $deployments += $url
        }
    }
}

if ($deployments.Count -eq 0) {
    Write-Host "Aucun deploiement trouve" -ForegroundColor Yellow
    exit 0
}

Write-Host "Total de deploiements trouves: $($deployments.Count)" -ForegroundColor Cyan
Write-Host ""

# Garder seulement les 2 plus recents
$toKeep = $deployments[0..1]
$toDelete = $deployments[2..($deployments.Count - 1)]

Write-Host "Deploiements a CONSERVER (2 plus recents):" -ForegroundColor Green
for ($i = 0; $i -lt $toKeep.Count; $i++) {
    Write-Host "   $($i + 1). $($toKeep[$i])" -ForegroundColor Green
}

if ($toDelete.Count -eq 0) {
    Write-Host ""
    Write-Host "Aucun deploiement a supprimer. Vous avez deja seulement 2 deploiements ou moins." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Deploiements a SUPPRIMER ($($toDelete.Count)):" -ForegroundColor Yellow
for ($i = 0; $i -lt $toDelete.Count; $i++) {
    Write-Host "   $($i + 1). $($toDelete[$i])" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Vous etes sur le point de supprimer $($toDelete.Count) deploiement(s)." -ForegroundColor Red
Write-Host "Cette action est irreversible." -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Voulez-vous continuer? (O/N)"

if ($confirm -ne "O" -and $confirm -ne "o" -and $confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Operation annulee" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Suppression en cours..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$errorCount = 0

foreach ($url in $toDelete) {
    try {
        Write-Host "Suppression de: $url..." -ForegroundColor Cyan
        $result = vercel rm $url --yes 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   Supprime avec succes" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "   Erreur lors de la suppression" -ForegroundColor Red
            $errorCount++
        }
        Write-Host ""
    } catch {
        Write-Host "   Erreur: $_" -ForegroundColor Red
        $errorCount++
        Write-Host ""
    }
}

Write-Host "Resume:" -ForegroundColor Cyan
Write-Host "   Supprimes: $successCount" -ForegroundColor Green
Write-Host "   Erreurs: $errorCount" -ForegroundColor Red
Write-Host "   Conserves: $($toKeep.Count)" -ForegroundColor Green
Write-Host ""
Write-Host "Nettoyage termine!" -ForegroundColor Green
