/**
 * Nettoie la description d'un produit pour l'affichage
 * Retire les métadonnées techniques (ID Odoo, etc.)
 */
export function cleanProductDescription(description: string | undefined | null): string {
  if (!description) return ''
  
  return description
    .replace(/\s*\[Odoo ID:.*?\]\s*/g, '') // Retire [Odoo ID: ...]
    .replace(/\s*Réf:.*?\|/g, '') // Retire Réf: ...
    .replace(/\s*Coût:.*?\|/g, '') // Retire Coût: ...
    .replace(/\s*Poids:.*?\|/g, '') // Retire Poids: ...
    .replace(/\|/g, '') // Retire les pipes restants
    .trim()
}

