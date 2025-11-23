import mongoose, { Schema, Document, Model } from 'mongoose'

// User Model
export interface IUser extends Document {
  name: string
  email: string
  password: string
  phone?: string
  address?: {
    street?: string
    city?: string
    zipCode?: string
  }
  role: 'customer' | 'admin' | 'delivery'
  geoLocation?: {
    lat: number
    lng: number
    lastUpdate: Date
  }
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String },
    address: {
      street: String,
      city: String,
      zipCode: String,
    },
    role: { type: String, enum: ['customer', 'admin', 'delivery'], default: 'customer' },
    geoLocation: {
      lat: { type: Number },
      lng: { type: Number },
      lastUpdate: { type: Date },
    },
  },
  { timestamps: true }
)

// Hash password before save (will be handled in the API route with bcrypt)
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  // Utiliser la fonction helper pour comparer les mots de passe
  const { comparePassword } = await import('./bcrypt.js')
  return comparePassword(candidatePassword, this.password)
}

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema)

// Category Model
export interface ICategory extends Document {
  name: string
  description?: string
  imageUrl?: string
  displayOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema)

// Extra Model
export interface IExtra {
  name: string
  price: number
}

// Product Model
export interface IProduct extends Document {
  categoryId: mongoose.Types.ObjectId
  name: string
  description?: string
  price: number
  imageUrl?: string
  extras?: IExtra[]
  preparationTime: number // Temps de préparation en minutes
  deliveryTime: number // Temps de livraison en minutes
  isAvailable: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

const extraSchema = new Schema<IExtra>({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
}, { _id: false })

const productSchema = new Schema<IProduct>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
    extras: { type: [extraSchema], default: [] },
    preparationTime: { type: Number, required: true, min: 0, default: 15 }, // Temps de préparation en minutes
    deliveryTime: { type: Number, required: true, min: 0, default: 20 }, // Temps de livraison en minutes
    isAvailable: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema)

// Order Item Schema
export interface IOrderItem {
  productId: mongoose.Types.ObjectId
  quantity: number
  price: number
  name: string
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  name: { type: String, required: true },
})

// Order Model
export interface IOrder extends Document {
  userId?: mongoose.Types.ObjectId
  tableNumber?: string
  orderType: 'sur_place' | 'emporter' | 'livraison'
  deliveryAddress?: {
    fullAddress: string
    street?: string
    city?: string
    zipCode?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'assigned' | 'on_the_way' | 'delivered' | 'cancelled'
  assignedDeliveryId?: mongoose.Types.ObjectId
  items: IOrderItem[]
  totalAmount: number
  customerInfo?: {
    name?: string
    phone?: string
    email?: string
  }
  createdAt: Date
  updatedAt: Date
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    tableNumber: { type: String },
    orderType: { type: String, enum: ['sur_place', 'emporter', 'livraison'], required: true },
    deliveryAddress: {
      fullAddress: { type: String, required: false },
      street: { type: String },
      city: { type: String },
      zipCode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    status: { type: String, enum: ['pending', 'accepted', 'preparing', 'ready', 'assigned', 'on_the_way', 'delivered', 'cancelled'], default: 'pending' },
    assignedDeliveryId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    customerInfo: {
      name: String,
      phone: String,
      email: String,
    },
  },
  { timestamps: true }
)

export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema)

// Reservation Model
export interface IReservation extends Document {
  userId?: mongoose.Types.ObjectId
  customerInfo: {
    name: string
    phone: string
    email?: string
  }
  date: Date
  time: string
  numberOfGuests: number
  tableNumber?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const reservationSchema = new Schema<IReservation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerInfo: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true },
    },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    numberOfGuests: { type: Number, required: true, min: 1 },
    tableNumber: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
      default: 'pending' 
    },
    notes: { type: String },
  },
  { timestamps: true }
)

export const Reservation: Model<IReservation> = mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', reservationSchema)

