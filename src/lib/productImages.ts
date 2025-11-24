type ProductRef = {
  name?: string | null
  imageUrl?: string | null
}

const encodeMenuImagePath = (fileName: string) =>
  `/images/Menu/${encodeURIComponent(fileName).replace(/%2F/g, '/')}`

export const productImageFileMap: Record<string, string> = {
  'Glace 2 boules': '2 boules de glace.jpg',
  'Brochettes lotte': 'Brochettes lotte.webp',
  'Brochettes mixtes': 'Brochettes mixtes.jpg',
  'Brochettes poulet': 'Brochettes poulet.jpeg',
  'Coca-Cola': 'Coca-Cola.jpg',
  'Cocktail avocat crevettes': 'Cocktail avocat crevettes.jpg',
  'Cordon bleu': 'Cordon bleu.jpg',
  'Crevettes sautées ail': 'Crevettes sautées ail.jpg',
  'Eau gazeuse': 'Eau gazeuse.jpg',
  'Eau minérale': 'Eau minérale.webp',
  'Émincé bœuf': 'Émincé bœuf.jpg',
  'Faata Fresh (Jus frais)': 'Faata Fresh (Jus frais).jpg',
  'Fanta Orange': 'Fanta Orange.webp',
  'Filet lotte pané': 'Filet lotte pané.jpeg',
  'Fondant chocolat': 'Fondant chocolat.jpg',
  Frites: 'Frites.jpg',
  'Gambas grillées': 'Gambas grillées.jpg',
  'Gratin dauphinois': 'Gratin dauphinois.webp',
  'Ice Tea Pêche': 'Ice Tea Pêche.jpg',
  'Légumes sautés': 'Legumes-sautes.jpg',
  'Mousse passion': 'Mousse passion.avif',
  'Poisson braisé': 'Poisson braisé.jpg',
  'Pommes terre sautées': 'Pommes terre sautées.jpeg',
  'Poulet grillé': 'Poulet grillé.jpg',
  'Poulet pané': 'Poulet pané.jpg',
  'Ragoût bœuf': 'Ragoût bœuf.webp',
  'Riz blanc': 'Riz blanc.jpg',
  'Riz pilaf': 'Riz pilaf.jpg',
  'Salade chef': 'Salade chef.jpg',
  'Salade chinoise': 'Salade chinoise.jpg',
  'Salade exotique': 'Salade exotique.webp',
  'Salade italienne': 'Salade italienne.webp',
  'Salade niçoise': 'Salade niçoise.jpg',
  'Sole Colbert': 'Sole Colbert.png',
  'Sole meunière': 'Sole meunière.webp',
  Spaghetti: 'Spaghetti.png',
  Sprite: 'Sprite.png',
  'Steak grillé': 'Steak grillé.avif',
  'Sunset Beach (Cocktail sans alcool)': 'Sunset Beach (Cocktail sans alcool).png',
  'Tarte coco': 'Tarte coco.jpg',
  'Virgin Mojito': 'Virgin Mojito.jpg'
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


