import * as Dialog from '@radix-ui/react-dialog'
import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn" />
        <Dialog.Content
          className={`fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl z-50 w-full ${sizeClasses[size]} max-h-[95vh] md:max-h-[90vh] overflow-y-auto animate-slideUp`}
        >
          {title && (
            <div className="px-5 md:px-6 py-4 md:py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <Dialog.Title className="text-xl md:text-2xl font-bold text-gray-900">{title}</Dialog.Title>
            </div>
          )}
          <div className="p-5 md:p-6">{children}</div>
          <Dialog.Close asChild>
            <button
              className="absolute top-3 md:top-4 right-3 md:right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 md:p-0"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

