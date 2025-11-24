type ProductRef = {
  name?: string | null
  imageUrl?: string | null
}

const encodeMenuImagePath = (fileName: string) =>
  `/images/Menu/${encodeURIComponent(fileName).replace(/%2F/g, '/')}`

export const productImageFileMap: Record<string, string> = {
  'Glace 2 boules': 'Glace 2 boules.png',
  'Brochettes lotte': 'Brochettes lotte.png',
  'Brochettes mixtes': 'Brochettes mixtes.png',
  'Brochettes poulet': 'Brochettes poulet.png',
  'Coca-Cola': 'Coca-Cola.png',
  'Cocktail avocat crevettes': 'Cocktail avocat crevettes.png',
  'Cordon bleu': 'Cordon bleu.png',
  'Crevettes sautées ail': 'Crevettes sautees ail.png',
  'Eau gazeuse': 'Eau gazeuse.png',
  'Eau minérale': 'Eau minerale.png',
  'Émincé bœuf': 'Emince boeuf.png',
  'Fanta Orange': 'Fanta Orange.png',
  'Filet lotte pané': 'Filet lotte pane.png',
  'Fondant chocolat': 'Fondant chocolat.png',
  Frites: 'Frites.png',
  'Gambas grillées': 'Gambas grillees.png',
  'Gratin dauphinois': 'Gratin dauphinois.png',
  'Ice Tea Pêche': 'Ice Tea Peche.png',
  'Légumes sautés': 'Legumes sautes.png',
  'Mousse passion': 'Mousse passion.png',
  'Poisson braisé': 'Poisson braise.png',
  'Pommes terre sautées': 'Pommes terre sautees.png',
  'Poulet grillé': 'Poulet grille.png',
  'Poulet pané': 'Poulet pane.png',
  'Ragoût bœuf': 'Ragout boeuf.png',
  'Riz blanc': 'Riz blanc.png',
  'Riz pilaf': 'Riz pilaf.png',
  'Salade chef': 'Salade chef.png',
  'Salade chinoise': 'Salade chinoise.png',
  'Salade exotique': 'Salade exotique.png',
  'Salade italienne': 'Salade italienne.png',
  'Salade niçoise': 'Salade nicoise.png',
  'Sole Colbert': 'Sole Colbert.png',
  'Sole meunière': 'Sole meuniere.png',
  Spaghetti: 'Spaghetti.png',
  Sprite: 'Sprite.png',
  'Steak grillé': 'Steak grille.png',
  'Sunset Beach (Cocktail sans alcool)': 'Sunset Beach (Cocktail sans alcool).png',
  'Tarte coco': 'Tarte coco.png',
  'Virgin Mojito': 'Virgin Mojito.png'
}

export const productImagePathMap: Record<string, string> = Object.fromEntries(
  Object.entries(productImageFileMap).map(([name, file]) => [name, encodeMenuImagePath(file)])
)

export const getImagePathByName = (name?: string | null) => {
  if (!name) return null
  return productImagePathMap[name] || null
}

export const getProductImage = (product?: ProductRef | null) => {
  if (!product) return ''
  const localImage = getImagePathByName(product.name || undefined)
  if (localImage) return localImage
  return product.imageUrl || ''
}


