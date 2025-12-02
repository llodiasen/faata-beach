#!/bin/bash

# Script de sauvegarde des variables d'environnement Vercel
# Usage: ./scripts/backup-vercel-env.sh

echo "💾 Sauvegarde de la configuration Vercel..."

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "📦 Installation: npm i -g vercel"
    exit 1
fi

# Créer le dossier de backup s'il n'existe pas
mkdir -p backups

# Date pour le nom du fichier
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="backups/vercel-env-backup-$DATE.txt"

echo "📝 Export des variables d'environnement..."
vercel env ls > "$BACKUP_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Sauvegarde créée: $BACKUP_FILE"
    echo "📊 Contenu:"
    cat "$BACKUP_FILE"
else
    echo "❌ Erreur lors de la sauvegarde"
    exit 1
fi

