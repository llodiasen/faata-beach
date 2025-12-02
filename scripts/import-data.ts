import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import mongoose from 'mongoose'
import { getImagePathByName } from '../src/lib/productImages.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger les variables d'environnement AVANT d'importer mongodb
const envPath = join(__dirname, '..', '.env')
dotenv.config({ path: envPath })

// Vérifier que MONGODB_URI est chargé
if (!process.env.MONGODB_URI) {
  // Essayer de lire directement le fichier .env
  try {
    const envFile = readFileSync(envPath, 'utf-8')
    const lines = envFile.split('\n')
    for (const line of lines) {
      const match = line.match(/^MONGODB_URI=(.+)$/)
      if (match) {
        process.env.MONGODB_URI = match[1].trim()
        break
      }
    }
  } catch (e) {
    console.error('Erreur lors de la lecture du fichier .env:', e)
  }
}

// Importer les modèles après avoir chargé les variables d'environnement
// On doit définir MONGODB_URI avant d'importer les modèles
const MONGODB_URI = process.env.MONGODB_URI || ''

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI n\'est pas défini dans .env')
}

// Importer les modèles directement sans utiliser mongodb.ts
const { Category, Product } = await import('../api/lib/models.js')

// Les prix sont maintenant directement en CFA (Franc CFA Sénégalais)
// Plus besoin de conversion, les prix sont déjà adaptés au marché sénégalais

// Fonction pour obtenir le temps de préparation spécifique pour chaque produit
function getPreparationTimeForProduct(productName: string): number {
  // Mapping des durées de préparation par produit (en minutes)
  const preparationTimes: Record<string, number> = {
    // ENTRÉES
    'Œuf mimosa': 6,
    'Salade d\'avocat': 5,
    'Cocktail de crevette': 7,
    'Choux à l\'anglaise': 6,
    'Salade de fruit de mer': 8,
    'Tomate mozzarella': 5,
    'Calamar frite': 9, // Moyenne de 8-10 min
    'Cocktail de crevette aux agrumes': 7,
    'Beignets de crevettes': 9, // Moyenne de 8-10 min
    'Soupe de légumes': 6,
    'Soupe de poisson': 6,
    'Salade niçoise': 6,
    'Salade du chef': 6,
    'Cocktail d\'avocat aux crevettes': 7,
    'Salade italienne': 6,
    'Salade exotique': 6,
    'Salade chinoise': 6,
    
    // PLATS — À BASE DE POISSON
    'Brochettes de lotte': 15,
    'Poisson braisé': 23, // Moyenne de 20-25 min
    'Filet lotte pané': 14, // Moyenne de 12-15 min
    'Sole meunière': 15,
    'Sole Colbert': 17, // Moyenne de 15-18 min
    
    // PLATS — À BASE DE FRUITS DE MER
    'Crevettes sautées à l\'ail': 11, // Moyenne de 10-12 min
    'Gambas grillées': 14, // Moyenne de 12-15 min
    
    // PLATS — À BASE DE POULET
    'Brochettes de poulet': 14, // Moyenne de 12-15 min
    'Poulet grillé': 19, // Moyenne de 18-20 min
    'Poulet pané': 11, // Moyenne de 10-12 min
    'Cordon bleu': 14, // Moyenne de 12-15 min
    'Salade César poulet': 10,
    
    // PLATS — À BASE DE VIANDE
    'Brochette de viande': 15,
    'Brochette filet de bœuf': 19, // Moyenne de 18-20 min
    'Côte de bœuf': 23, // Moyenne de 20-25 min
    'Steak grillé': 14, // Moyenne de 12-15 min
    'Émincé de bœuf': 11, // Moyenne de 10-12 min
    'Brochettes mixtes': 17, // Moyenne de 15-18 min
    'Ragoût de bœuf': 28, // Moyenne de 25-30 min
    
    // PIZZAS
    'Pizza reine': 14, // Moyenne de 12-15 min
    'Pizza oriental': 14, // Moyenne de 12-15 min
    'Pizza au fruit de mer': 15, // Moyenne de 13-16 min
    'Pizza au fromage': 12,
    'Pizza viande hachée': 14, // Moyenne de 12-15 min
    
    // DESSERTS
    'Banane flambée': 6,
    'Bananes flambées': 6,
    'Salade de fruits': 5,
    'Fruits de saison': 3,
    'Crêpe au chocolat': 6,
    'Crêpe à base de fruits': 7, // Moyenne de 6-7 min
    
    // ACCOMPAGNEMENTS
    'Riz pilaf': 15,
    'Riz blanc': 12,
    'Frites': 9, // Moyenne de 8-10 min
    'Légumes sautés': 7, // Moyenne de 6-8 min
    'Pommes de terre sautées': 11, // Moyenne de 10-12 min
    'Spaghetti': 11, // Moyenne de 10-12 min
    'Gratin dauphinois': 30, // Moyenne de 25-35 min (ou 5 min si déjà prêt)
    
    // BOISSONS - Cocktails sans alcool
    'Île du Saloum': 4,
    'Teranga': 4,
    'Beach cumber': 3,
    'Beach Cumber': 3,
    'Virgil mojito': 5,
    'Virgil colada': 4,
    'Fraîcheur des îles': 4,
    'Touraco basilic': 5,
    'Lac rose': 4,
    
    // BOISSONS - Cocktails avec alcool
    'Bloody mary': 5,
    'Mojito': 6, // Moyenne de 5-6 min
    'Ti punch': 3,
    'Piña colada': 4,
    'Pina colada': 4,
    'Moscow mule': 4,
    'Nik fizz': 4,
    'Americano': 3,
    'Margarita': 4,
    'Tom collins': 4,
    'Negroni': 3,
    'Yummy\'mosa': 3,
    
    // BOISSONS - Jus locaux
    'Bissap': 1,
    'Bouye': 1,
    'Gingembre': 1,
    'Orange pressée': 4, // Moyenne de 3-4 min
    
    // BOISSONS - Softs
    'Coca normal': 1,
    'Coca zéro': 1,
    'Fanta': 1,
    'Sprite': 1,
    'Tonic': 1,
    
    // BOISSONS - Bières
    'Gazelle': 1,
    'Flag': 1,
    
    // BOISSONS - Jus frais
    'Coco ananas': 4,
    'Orange': 3,
    'Ananas': 3,
    'Cocktail': 4,
    'Goyave': 3,
    
    // BOISSONS - Café & Thé
    'Café': 2,
    'Thé': 2,
  }
  
  // Retourner le temps spécifique ou une valeur par défaut
  return preparationTimes[productName] || 15
}

// Fonction pour obtenir les temps de préparation et livraison selon la catégorie (pour les valeurs par défaut)
function getDeliveryTimesForCategory(categoryName: string): { preparationTime: number; deliveryTime: number } {
  const times: Record<string, { preparationTime: number; deliveryTime: number }> = {
    'Entrées': { preparationTime: 10, deliveryTime: 15 },
    'Plats — À base de poisson': { preparationTime: 20, deliveryTime: 20 },
    'Plats — À base de fruits de mer': { preparationTime: 25, deliveryTime: 20 },
    'Plats — À base de poulet': { preparationTime: 18, deliveryTime: 20 },
    'Plats — À base de viande': { preparationTime: 22, deliveryTime: 20 },
    'Accompagnements': { preparationTime: 12, deliveryTime: 15 },
    'Boissons': { preparationTime: 5, deliveryTime: 15 },
    'Desserts': { preparationTime: 8, deliveryTime: 15 },
    'Pizzas': { preparationTime: 15, deliveryTime: 20 },
  }
  
  return times[categoryName] || { preparationTime: 15, deliveryTime: 20 }
}

// Fonction pour obtenir les extras selon la catégorie (prix en CFA Sénégalais)
function getExtrasForCategory(categoryName: string): Array<{ name: string; price: number }> {
  const extras: Record<string, Array<{ name: string; price: number }>> = {
    'Entrées': [
      { name: 'Pain supplémentaire', price: 500 },
      { name: 'Huile d\'olive extra', price: 300 },
      { name: 'Vinaigrette maison', price: 200 },
    ],
    'Plats — À base de poisson': [
      { name: 'Riz supplémentaire', price: 500 },
      { name: 'Frites supplémentaires', price: 1000 },
      { name: 'Salade supplémentaire', price: 600 },
      { name: 'Sauce citron-beurre', price: 300 },
      { name: 'Légumes vapeur', price: 600 },
    ],
    'Plats — À base de fruits de mer': [
      { name: 'Riz pilaf supplémentaire', price: 500 },
      { name: 'Pain grillé', price: 500 },
      { name: 'Citron supplémentaire', price: 200 },
      { name: 'Sauce aïoli', price: 300 },
    ],
    'Plats — À base de poulet': [
      { name: 'Riz supplémentaire', price: 500 },
      { name: 'Frites supplémentaires', price: 1000 },
      { name: 'Salade supplémentaire', price: 600 },
      { name: 'Sauce BBQ supplémentaire', price: 300 },
      { name: 'Légumes sautés', price: 600 },
    ],
    'Plats — À base de viande': [
      { name: 'Riz supplémentaire', price: 500 },
      { name: 'Frites supplémentaires', price: 1000 },
      { name: 'Sauce au poivre', price: 400 },
      { name: 'Légumes sautés', price: 600 },
    ],
    'Accompagnements': [
      { name: 'Sauce supplémentaire', price: 300 },
      { name: 'Beurre supplémentaire', price: 200 },
    ],
    'Boissons': [
      { name: 'Glace supplémentaire', price: 300 },
      { name: 'Sirop supplémentaire', price: 400 },
      { name: 'Menthe fraîche', price: 300 },
    ],
    'Desserts': [
      { name: 'Chantilly supplémentaire', price: 400 },
      { name: 'Noix supplémentaires', price: 500 },
      { name: 'Coulis de fruits', price: 400 },
    ],
    'Pizzas': [
      { name: 'Fromage supplémentaire', price: 500 },
      { name: 'Chorizo supplémentaire', price: 800 },
      { name: 'Olives supplémentaires', price: 300 },
    ],
  }
  
  return extras[categoryName] || []
}

const data = {
  "categories": [
    {
      "name": "Boissons",
      "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format",
      "products": [
        // Cocktails sans alcools - 3500 FCFA
        { "name": "Île du Saloum", "price": 3500, "description": "Cocktail rafraîchissant à l'ananas, pamplemousse, citron et sucre de canne", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Teranga", "price": 3500, "description": "Mélange exotique d'ananas, bissap, gingembre et sirop de fraise", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Beach cumber", "price": 3500, "description": "Cocktail tropical à la goyave, citron et grenadine", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Virgil mojito", "price": 3500, "description": "Mojito sans alcool aux feuilles de menthe, citron et sucre de canne", "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&h=800&fit=crop&auto=format" },
        { "name": "Virgil colada", "price": 3500, "description": "Cocktail crémeux au lait de coco et jus d'ananas", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Fraîcheur des îles", "price": 3500, "description": "Jus de mangue frais avec citron et basilic", "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Touraco basilic", "price": 3500, "description": "Cocktail original au basilic, jus de citron et blanc d'œuf", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Lac rose", "price": 3500, "description": "Cocktail crémeux au sirop de grenadine, crème et jus d'ananas", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        
        // Cocktails avec alcools - 4500 FCFA
        { "name": "Bloody mary", "price": 4500, "description": "Cocktail épicé au jus de tomate, vodka et tabasco", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Mojito", "price": 4500, "description": "Classique cubain à la menthe, citron, rhum et sucre de canne", "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&h=800&fit=crop&auto=format" },
        { "name": "Ti punch", "price": 4500, "description": "Punch antillais au rhum blanc et sucre de canne", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Piña colada", "price": 4500, "description": "Cocktail tropical au rhum blanc, lait de coco, jus d'ananas et crème", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Moscow mule", "price": 4500, "description": "Cocktail rafraîchissant au rhum blanc, citron, sucre roux et ginger beer", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Nik fizz", "price": 4500, "description": "Cocktail pétillant au jus de pamplemousse, eau gazeuse et gin", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Americano", "price": 4500, "description": "Cocktail italien au martini rouge et campari soda", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Margarita", "price": 4500, "description": "Cocktail mexicain à la tequila, citron et triple sec", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Tom collins", "price": 4500, "description": "Cocktail classique au gin, citron, sucre de canne et eau pétillante", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Negroni", "price": 4500, "description": "Cocktail italien au gin, campari, vermouth et zeste d'orange", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Yummy'mosa", "price": 4500, "description": "Cocktail original au jus d'orange, grenadine et bière", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        
        // Jus locaux - 1000 FCFA
        { "name": "Bissap", "price": 1000, "description": "Jus traditionnel de bissap, rafraîchissant et vitaminé", "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Bouye", "price": 1000, "description": "Jus naturel de bouye, fruit du baobab", "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Gingembre", "price": 1000, "description": "Jus de gingembre frais, piquant et tonifiant", "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Orange pressée", "price": 1000, "description": "Jus d'orange fraîchement pressé, vitaminé et naturel", "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        
        // Softs - 1000 FCFA
        { "name": "Coca normal", "price": 1000, "description": "Boisson gazeuse rafraîchissante au cola", "image": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=800&fit=crop&auto=format" },
        { "name": "Coca zéro", "price": 1000, "description": "Boisson gazeuse au cola sans sucre", "image": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=800&fit=crop&auto=format" },
        { "name": "Fanta", "price": 1000, "description": "Boisson gazeuse à l'orange, fruitée et désaltérante", "image": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Sprite", "price": 1000, "description": "Boisson gazeuse au citron, fraîche et pétillante", "image": "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Tonic", "price": 1000, "description": "Eau tonique pétillante au quinine", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        
        // Bières
        { "name": "Gazelle", "price": 1500, "description": "Bière locale sénégalaise, fraîche et légère", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Flag", "price": 1000, "description": "Bière locale rafraîchissante", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        
        // Jus frais - 1000 FCFA
        { "name": "Coco ananas", "price": 1000, "description": "Jus frais de noix de coco et ananas", "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Orange", "price": 1000, "description": "Jus d'orange frais pressé", "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Ananas", "price": 1000, "description": "Jus d'ananas frais et naturel", "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Cocktail", "price": 1000, "description": "Cocktail de fruits frais pressés", "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        { "name": "Goyave", "price": 1000, "description": "Jus de goyave frais et fruité", "image": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2fdc?w=800&h=800&fit=crop&auto=format" },
        
        // Café et Thé - 1000 FCFA
        { "name": "Café", "price": 1000, "description": "Café local torréfié, servi chaud ou glacé", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Thé", "price": 1000, "description": "Thé à la menthe traditionnel ou thé nature", "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Entrées",
      "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Salade niçoise", "price": 4000, "description": "Salade fraîche aux légumes de saison, thon, olives et œufs", "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=800&fit=crop&auto=format" },
        { "name": "Salade du chef", "price": 4500, "description": "Salade composée avec poulet grillé, fromage et légumes croquants", "image": "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&h=800&fit=crop&auto=format" },
        { "name": "Cocktail d'avocat aux crevettes", "price": 5000, "description": "Avocat frais accompagné de crevettes roses et sauce cocktail", "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" },
        { "name": "Salade italienne", "price": 4200, "description": "Mélange de légumes frais, mozzarella et vinaigrette balsamique", "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=800&fit=crop&auto=format" },
        { "name": "Salade exotique", "price": 4500, "description": "Fruits tropicaux et légumes frais avec une touche d'exotisme", "image": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d1?w=800&h=800&fit=crop&auto=format" },
        { "name": "Salade chinoise", "price": 4300, "description": "Légumes croquants et nouilles avec sauce soja et sésame", "image": "https://images.unsplash.com/photo-1505252585461-04c2a47d63d8?w=800&h=800&fit=crop&auto=format" },
        { "name": "Œuf mimosa", "price": 3500, "description": "Œufs durs farcis à la mayonnaise et aux herbes", "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=800&fit=crop&auto=format" },
        { "name": "Salade d'avocat", "price": 3500, "description": "Avocat frais avec vinaigrette et légumes croquants", "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=800&fit=crop&auto=format" },
        { "name": "Cocktail de crevette", "price": 3500, "description": "Crevettes roses fraîches servies avec sauce cocktail", "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" },
        { "name": "Choux à l'anglaise", "price": 3500, "description": "Choux de Bruxelles à l'anglaise, légers et savoureux", "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=800&fit=crop&auto=format" },
        { "name": "Salade de fruit de mer", "price": 4000, "description": "Mélange de fruits de mer frais avec vinaigrette", "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" },
        { "name": "Tomate mozzarella", "price": 3500, "description": "Tomates fraîches, mozzarella et basilic, huile d'olive", "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=800&fit=crop&auto=format" },
        { "name": "Calamar frite", "price": 4000, "description": "Calamars frits croustillants, servis avec sauce aïoli", "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" },
        { "name": "Cocktail de crevette aux agrumes", "price": 3500, "description": "Crevettes fraîches avec agrumes et vinaigrette citronnée", "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" },
        { "name": "Beignets de crevettes", "price": 3500, "description": "Beignets croustillants aux crevettes, servis chauds", "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" },
        { "name": "Soupe de légumes", "price": 3500, "description": "Soupe maison aux légumes frais de saison", "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=800&fit=crop&auto=format" },
        { "name": "Soupe de poisson", "price": 4000, "description": "Soupe traditionnelle au poisson frais et légumes", "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Plats — À base de poisson",
      "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Brochettes de lotte", "price": 6500, "description": "Brochettes de lotte grillées aux épices, servies avec riz et légumes", "image": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=800&fit=crop&auto=format" },
        { "name": "Poisson braisé", "price": 7000, "description": "Poisson frais braisé aux herbes et épices, accompagné de légumes", "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" },
        { "name": "Filet lotte pané", "price": 7500, "description": "Filet de lotte pané croustillant, servi avec frites et salade", "image": "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=800&fit=crop&auto=format" },
        { "name": "Sole meunière", "price": 8000, "description": "Sole fraîche cuite au beurre, citron et persil, accompagnée de légumes", "image": "https://images.unsplash.com/photo-1574781330858-c0ff99397e2e?w=800&h=800&fit=crop&auto=format" },
        { "name": "Sole Colbert", "price": 8500, "description": "Sole farcie et panée, servie avec beurre maître d'hôtel et légumes", "image": "https://images.unsplash.com/photo-1574781330858-c0ff99397e2e?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Plats — À base de fruits de mer",
      "image": "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Crevettes sautées à l'ail", "price": 8000, "description": "Crevettes fraîches sautées à l'ail et aux herbes, servies avec riz pilaf", "image": "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=800&fit=crop&auto=format" },
        { "name": "Gambas grillées", "price": 9500, "description": "Grosses gambas grillées au barbecue, accompagnées de légumes grillés", "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Plats — À base de poulet",
      "image": "https://images.unsplash.com/photo-1626645738195-c58a114b49b2?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Brochettes de poulet", "price": 5500, "description": "Brochettes de poulet mariné et grillé, servies avec riz et légumes", "image": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=800&fit=crop&auto=format" },
        { "name": "Poulet grillé", "price": 6000, "description": "Poulet entier grillé aux épices, accompagné de frites et salade", "image": "https://images.unsplash.com/photo-1626645738195-c58a114b49b2?w=800&h=800&fit=crop&auto=format" },
        { "name": "Poulet pané", "price": 5800, "description": "Escalope de poulet panée croustillante, servie avec frites et sauce", "image": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=800&fit=crop&auto=format" },
        { "name": "Cordon bleu", "price": 6500, "description": "Escalope de poulet farcie au jambon et fromage, panée et dorée", "image": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Plats — À base de viande",
      "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Steak grillé", "price": 8500, "description": "Steak de bœuf grillé à point, servi avec frites et légumes", "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=800&fit=crop&auto=format" },
        { "name": "Émincé de bœuf", "price": 7500, "description": "Émincé de bœuf sauté aux légumes et épices, servi avec riz", "image": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800&h=800&fit=crop&auto=format" },
        { "name": "Brochettes mixtes", "price": 7000, "description": "Brochettes de viande et légumes grillés, accompagnées de riz", "image": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&h=800&fit=crop&auto=format" },
        { "name": "Ragoût de bœuf", "price": 7200, "description": "Ragoût de bœuf mijoté aux légumes et épices, servi avec riz", "image": "https://images.unsplash.com/photo-1626645738195-c58a114b49b2?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Accompagnements",
      "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Riz pilaf", "price": 1500, "description": "Riz parfumé cuit au bouillon avec épices et légumes", "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=800&fit=crop&auto=format" },
        { "name": "Riz blanc", "price": 1200, "description": "Riz blanc cuit à la vapeur, léger et savoureux", "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=800&fit=crop&auto=format" },
        { "name": "Frites", "price": 2000, "description": "Pommes de terre frites croustillantes, servies avec sauce", "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop&auto=format" },
        { "name": "Légumes sautés", "price": 2500, "description": "Mélange de légumes frais sautés aux herbes et épices", "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=800&fit=crop&auto=format" },
        { "name": "Pommes de terre sautées", "price": 2200, "description": "Pommes de terre sautées à la poêle avec herbes et beurre", "image": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&h=800&fit=crop&auto=format" },
        { "name": "Spaghetti", "price": 2000, "description": "Spaghetti al dente servis avec sauce tomate et fromage", "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=800&fit=crop&auto=format" },
        { "name": "Gratin dauphinois", "price": 2800, "description": "Gratin de pommes de terre à la crème et au fromage", "image": "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Desserts",
      "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Banane flambée", "price": 2000, "description": "Banane flambée au rhum, servie avec glace vanille", "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format" },
        { "name": "Salade de fruits", "price": 2000, "description": "Mélange de fruits frais de saison, servis frais", "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format" },
        { "name": "Fruits de saison", "price": 2000, "description": "Assortiment de fruits frais de saison", "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format" },
        { "name": "Crêpe au chocolat", "price": 2000, "description": "Crêpe chaude garnie de chocolat fondu", "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format" },
        { "name": "Crêpe à base de fruits", "price": 2000, "description": "Crêpe chaude garnie de fruits frais et coulis", "image": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=800&fit=crop&auto=format" }
      ]
    },
    {
      "name": "Pizzas",
      "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=800&fit=crop&auto=format",
      "products": [
        { "name": "Pizza reine", "price": 5000, "description": "Pizza aux champignons, jambon et fromage", "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=800&fit=crop&auto=format" },
        { "name": "Pizza oriental", "price": 5000, "description": "Pizza aux saveurs orientales, épices et légumes", "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=800&fit=crop&auto=format" },
        { "name": "Pizza au fruit de mer", "price": 5000, "description": "Pizza garnie de fruits de mer frais et fromage", "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=800&fit=crop&auto=format" },
        { "name": "Pizza au fromage", "price": 5000, "description": "Pizza aux fromages, mozzarella et parmesan", "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=800&fit=crop&auto=format" },
        { "name": "Pizza viande hachée", "price": 5000, "description": "Pizza à la viande hachée, tomate et fromage", "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=800&fit=crop&auto=format" }
      ]
    }
  ]
}

async function importData() {
  try {
    // Connexion directe à MongoDB
    console.log('🔄 Connexion à MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connecté à MongoDB')

    // Supprimer les anciennes données (optionnel)
    console.log('🗑️  Suppression des anciennes données...')
    await Category.deleteMany({})
    await Product.deleteMany({})
    console.log('✅ Anciennes données supprimées')

    // Importer les catégories et produits
    for (let categoryIndex = 0; categoryIndex < data.categories.length; categoryIndex++) {
      const categoryData = data.categories[categoryIndex]
      
      // Créer la catégorie
      const category = new Category({
        name: categoryData.name,
        imageUrl: categoryData.image, // Ajouter l'image de la catégorie
        isActive: true,
        displayOrder: categoryIndex + 1
      })
      await category.save()
      console.log(`✅ Catégorie créée: ${category.name} (ID: ${category._id})`)

      // Obtenir les extras et les temps pour cette catégorie
      const categoryExtras = getExtrasForCategory(categoryData.name)
      const deliveryTimes = getDeliveryTimesForCategory(categoryData.name)
      
      // Créer les produits de cette catégorie
      for (let productIndex = 0; productIndex < categoryData.products.length; productIndex++) {
        const productData = categoryData.products[productIndex]
        
        // Les prix sont déjà en CFA (pas de conversion nécessaire)
        const localImage = getImagePathByName(productData.name)
        
        // Obtenir le temps de préparation spécifique pour ce produit
        const specificPreparationTime = getPreparationTimeForProduct(productData.name)

        const product = new Product({
          categoryId: category._id,
          name: productData.name,
          description: productData.description || undefined,
          price: productData.price, // Prix déjà en CFA
          imageUrl: localImage || productData.image,
          extras: categoryExtras, // Ajouter les extras de la catégorie
          preparationTime: specificPreparationTime, // Temps de préparation spécifique en minutes
          deliveryTime: deliveryTimes.deliveryTime, // Temps de livraison en minutes
          isAvailable: true,
          displayOrder: productIndex + 1
        })
        
        await product.save()
        const totalTime = specificPreparationTime + deliveryTimes.deliveryTime
        console.log(`   ✅ Produit créé: ${product.name} (${productData.price} CFA) - ${categoryExtras.length} extras - ${totalTime} min (${specificPreparationTime} min prép + ${deliveryTimes.deliveryTime} min livraison)`)
      }
    }

    console.log('\n🎉 Importation terminée avec succès!')
    console.log(`📊 ${data.categories.length} catégories créées`)
    const totalProducts = data.categories.reduce((sum, cat) => sum + cat.products.length, 0)
    console.log(`📊 ${totalProducts} produits créés`)

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'importation:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Déconnecté de MongoDB')
  }
}

importData()

