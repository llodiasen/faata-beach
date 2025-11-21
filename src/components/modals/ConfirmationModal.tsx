import { useModalStore } from '../../store/useModalStore'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export function ConfirmationModal() {
  const { currentModal, closeModal, openModal } = useModalStore()

  const handleClose = () => {
    closeModal()
    openModal('categories')
  }

  return (
    <Modal isOpen={currentModal === 'confirmation'} onClose={handleClose} title="Commande confirmée !" size="md">
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Merci pour votre commande !</h2>
        <p className="text-gray-600 mb-6">
          Votre commande a été enregistrée avec succès. Vous serez notifié lorsque votre commande sera prête.
        </p>
        <Button variant="primary" onClick={handleClose} className="w-full">
          Commander à nouveau
        </Button>
      </div>
    </Modal>
  )
}

