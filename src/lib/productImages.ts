type ProductRef = {
  name?: string | null
  imageUrl?: string | null
}

const encodeMenuImagePath = (fileName: string) =>
  `/images/Menu/menu og/${encodeURIComponent(fileName).replace(/%2F/g, '/')}`

const encodeDirectMenuImagePath = (fileName: string) =>
  `/images/Menu/${encodeURIComponent(fileName).replace(/%2F/g, '/')}`

// Images directement dans le dossier Menu (pas dans menu og)
const directMenuImages: Record<string, string> = {
  'Brochettes lotte': 'Brochettes lotte.png',
  'Brochettes de lotte': 'Brochettes lotte.png', // Variante avec "de"
}

export const productImageFileMap: Record<string, string> = {
  // Boissons - Cocktails sans alcools
  'Île du Saloum': 'Île du Saloum.jpg',
  'Teranga': 'Teranga.jpg',
  'Beach cumber': 'Beach Cumber.jpg',
  'Virgil mojito': 'Virgin Mojito.png',
  'Virgil colada': 'Virgil colada.jpg',
  'Fraîcheur des îles': 'Fraicheur des iles.jpg',
  'Touraco basilic': '241220241735049947.webp',
  'Lac rose': '241220241735049947.webp',
  
  // Boissons - Cocktails avec alcools
  'Bloody mary': 'Bloody mary.jpg',
  'Mojito': 'Mojito.webp',
  'Ti punch': 'Ti punch.webp',
  'Piña colada': 'Piña colada.webp',
  'Moscow mule': 'Moscow mule.webp',
  'Nik fizz': 'Nik fizz.webp',
  'Americano': 'Americano.jpg',
  'Margarita': 'Margarita.jpeg',
  'Tom collins': 'Tom Collins.jpg',
  'Negroni': 'Negroni.webp',
  'Yummy\'mosa': '241220241735049947.webp',
  
  // Boissons - Jus locaux
  'Bissap': 'jus bissap.jpg',
  'Bouye': 'jus bouye.jpg',
  'Gingembre': 'jus Gingembre.jpg',
  'Orange pressée': 'Orange pressée.webp',
  
  // Boissons - Softs
  'Coca normal': 'coca normal.jpeg',
  'Coca zéro': 'coca-zero-canette-33cl.webp',
  'Fanta': 'Fanta Orange.png',
  'Sprite': 'Sprite.png',
  'Tonic': 'Sprite.png',
  
  // Boissons - Bières
  'Gazelle': 'Flag.jpg',
  'Flag': 'Flag.jpg',
  
  // Boissons - Jus frais
  'Coco ananas': 'jus coco ananas.webp',
  'Orange': 'jus d;orange.webp',
  'Ananas': 'jus d\'ananas.jpg',
  'Cocktail': 'jus coctail.jpg',
  'Goyave': 'jus goyave.jpeg',
  
  // Boissons - Café et Thé
  'Café': 'Americano.jpg',
  'Thé': 'Americano.jpg',
  
  // Entrées
  'Salade niçoise': 'Salade niçoise.jpeg',
  'Salade du chef': 'Salade du chef.jpg',
  'Cocktail d\'avocat aux crevettes': 'Cocktail d\'avocat aux crevettes.jpeg',
  'Salade italienne': 'Salade italienne.jpg',
  'Salade exotique': 'Salade exotique.jpg',
  'Salade chinoise': 'Salade chinoise.png',
  'Œuf mimosa': 'Œuf mimosa.jpg',
  'Salade d\'avocat': 'Salade d\'avocat.jpeg',
  'Cocktail de crevette': 'Cocktail de crevette aux agrumes.jpeg',
  'Choux à l\'anglaise': 'Choux à l\'anglaise.webp',
  'Salade de fruit de mer': 'Salade fruits de mer.jpeg',
  'Tomate mozzarella': 'Tomate mozzarella.webp',
  'Calamar frite': 'Calamar frite.jpg',
  'Cocktail de crevette aux agrumes': 'Cocktail de crevette aux agrumes.jpeg',
  'Beignets de crevettes': 'Beignets de crevettes.jpeg',
  'Soupe de légumes': 'Soupe de legumes.jpeg',
  'Soupe de poisson': 'Soupe de poisson.webp',
  
  // Plats - À base de poisson
  'Poisson braisé': 'Poisson braisé.jpg',
  'Filet lotte pané': 'Filet lotte pane.png',
  'Sole meunière': 'Sole meuniere.png',
  'Sole Colbert': 'Sole Colbert.png',
  
  // Plats - À base de fruits de mer
  'Crevettes sautées à l\'ail': 'Crevettes sautées à l\'ail.jpg',
  'Gambas grillées': 'Gambas grillées.webp',
  
  // Plats - À base de poulet
  'Brochettes de poulet': 'Brochettes de poulet.jpg',
  'Poulet grillé': 'Poulet grillé.jpg',
  'Poulet pané': 'Poulet pané.jpg',
  'Cordon bleu': 'Cordon bleu.png',
  
  // Plats - À base de viande
  'Steak grillé': 'Steak grillé.jpg',
  'Émincé de bœuf': 'Émincé de bœuf.jpeg',
  'Brochettes mixtes': 'Brochettes mixtes.png',
  'Ragoût de bœuf': 'Ragout boeuf.png',
  
  // Accompagnements
  'Riz pilaf': 'Riz pilaf.jpg',
  'Riz blanc': 'Riz blanc.png',
  'Frites': 'Frites.jpeg',
  'Légumes sautés': 'Légumes sautés.webp',
  'Pommes de terre sautées': 'Pommes de terre sautées.jpg',
  'Spaghetti': 'Spaghetti.jpg',
  'Gratin dauphinois': 'Gratin dauphinois.png',
  
  // Desserts
  'Fondant chocolat': 'Fondant chocolat.png',
  'Mousse passion': 'Mousse passion.png',
  'Tarte coco': 'Tarte coco.png',
  'Glace 2 boules': 'Glace 2 boules.png',
  'Salade de fruits': 'Salade de fruits.webp',
  'Fruits de saison': 'Fruits de saison.webp',
  'Crêpe au chocolat': 'Crêpe au chocolat.jpg',
  'Crêpe à base de fruits': 'Crêpe à base de fruits.jpg',
  'Bananes flambées': 'Bananes flambees.jpg',
  
  // Pizzas
  'Pizza au fromage': 'Pizza au fromage.jpg',
  'Pizza au fruit de mer': 'Pizza au fruit de mer.jpeg',
  'Pizza reine': 'Pizza reine.webp',
  'Pizza viande hachée': 'Pizza viande hachée.jpg',
  
  // Anciens produits (pour compatibilité avec variantes de noms)
  'Coca-Cola': 'Coca-Cola.png',
  'Cocktail avocat crevettes': 'Cocktail avocat crevettes.png',
  'Crevettes sautées ail': 'Crevettes sautees ail.png',
  'Eau gazeuse': 'Eau gazeuse.png',
  'Eau minérale': 'Eau minerale.png',
  'Émincé bœuf': 'Émincé de bœuf.jpeg', // Utiliser la nouvelle image
  'Fanta Orange': 'Fanta Orange.png',
  'Ice Tea Pêche': 'Ice Tea Peche.png',
  'Pommes terre sautées': 'Pommes de terre sautées.jpg', // Utiliser la nouvelle image
  'Salade chef': 'Salade chef.png',
  'Sunset Beach (Cocktail sans alcool)': 'Sunset Beach (Cocktail sans alcool).png'
}

export const productImagePathMap: Record<string, string> = Object.fromEntries(
  Object.entries(productImageFileMap).map(([name, file]) => [name, encodeMenuImagePath(file)])
)

// Ajouter les images directes du dossier Menu
Object.entries(directMenuImages).forEach(([name, file]) => {
  productImagePathMap[name] = encodeDirectMenuImagePath(file)
})

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


