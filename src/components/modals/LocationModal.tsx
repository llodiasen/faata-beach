import { useState } from 'react'
import { useGeolocation } from '../../hooks/useGeolocation'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

interface LocationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LocationModal({ isOpen, onClose, onSuccess }: LocationModalProps) {
  const { getCurrentLocation, loading, error } = useGeolocation()
  const [processing, setProcessing] = useState(false)

  const handleAcceptLocation = async () => {
    setProcessing(true)
    try {
      const address = await getCurrentLocation()
      // Sauvegarder l'adresse dans localStorage
      localStorage.setItem('faata_deliveryAddress', JSON.stringify(address))
      localStorage.setItem('faata_orderType', 'livraison')
      
      // Fermer la modal et continuer vers les catégories
      setProcessing(false)
      onClose()
      
      // Appeler le callback de succès après un court délai
      setTimeout(() => {
        onSuccess()
      }, 100)
    } catch (err) {
      // L'erreur est déjà gérée par le hook et affichée
      setProcessing(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Localisation requise" size="sm">
      <div className="space-y-4">
        <p className="text-gray-700">
          Pour la livraison, nous avons besoin de votre localisation pour déterminer votre adresse.
        </p>
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            disabled={loading || processing}
          >
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAcceptLocation}
            disabled={loading || processing}
            className="flex-1"
          >
            {loading || processing ? 'Localisation...' : 'Autoriser la localisation'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

