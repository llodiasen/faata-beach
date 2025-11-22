import * as Dialog from '@radix-ui/react-dialog'
import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  noScroll?: boolean // Option pour désactiver le scroll
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', noScroll = false }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  const scrollClasses = noScroll 
    ? 'overflow-y-visible max-h-none' 
    : 'max-h-[90vh] overflow-y-auto'

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn" />
        <Dialog.Content
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full ${sizeClasses[size]} ${scrollClasses} animate-slideUp flex flex-col max-h-[90vh]`}
        >
          {title && (
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-white z-10">
              <Dialog.Title className="text-xl font-bold text-gray-900">{title}</Dialog.Title>
            </div>
          )}
          <div className={`p-6 flex-1 ${noScroll ? '' : 'overflow-y-auto'}`}>{children}</div>
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 z-20"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

