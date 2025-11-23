import { useState, useCallback } from 'react'

export interface Address {
  fullAddress: string
  street?: string
  city?: string
  zipCode?: string
  zone?: string
  coordinates: {
    lat: number
    lng: number
  }
}

export const useGeolocation = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<Address | null>(null)

  // Géocodage inverse : convertir les coordonnées GPS en adresse
  const reverseGeocode = async (lat: number, lng: number): Promise<Address> => {
    try {
      // Utiliser l'API de géocodage inverse (OpenStreetMap Nominatim - gratuit)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FAATA Beach App'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'adresse')
      }
      
      const data = await response.json()
      
      if (data && data.address) {
        const addr = data.address
        const fullAddress = data.display_name || `${addr.road || ''} ${addr.house_number || ''}, ${addr.postcode || ''} ${addr.city || addr.town || addr.village || ''}`.trim()
        
        return {
          fullAddress,
          street: addr.road ? `${addr.road} ${addr.house_number || ''}`.trim() : undefined,
          city: addr.city || addr.town || addr.village || undefined,
          zipCode: addr.postcode || undefined,
          coordinates: { lat, lng }
        }
      }
      
      throw new Error('Impossible de récupérer l\'adresse')
    } catch (err) {
      throw new Error('Erreur lors de la récupération de l\'adresse')
    }
  }

  const getCurrentLocation = useCallback(async (): Promise<Address> => {
    setLoading(true)
    setError(null)

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'La géolocalisation n\'est pas supportée par votre navigateur'
        setError(err)
        setLoading(false)
        reject(new Error(err))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            const addr = await reverseGeocode(latitude, longitude)
            setAddress(addr)
            setLoading(false)
            resolve(addr)
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la récupération de l\'adresse'
            setError(errorMsg)
            setLoading(false)
            reject(new Error(errorMsg))
          }
        },
        (err) => {
          const errorMsg = err.message === 'User denied Geolocation' 
            ? 'Vous devez autoriser la géolocalisation pour la livraison'
            : 'Erreur lors de la géolocalisation'
          setError(errorMsg)
          setLoading(false)
          reject(new Error(errorMsg))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }, [])

  return { getCurrentLocation, address, loading, error }
}

