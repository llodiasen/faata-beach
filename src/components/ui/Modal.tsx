import * as Dialog from '@radix-ui/react-dialog'
import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  noScroll?: boolean // Option pour désactiver le scroll
  transparentOverlay?: boolean // Option pour rendre l'overlay transparent
  heroBackground?: string // URL de l'image de fond du hero
  customHeader?: boolean // Option pour utiliser un header personnalisé (sans padding)
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', noScroll = false, transparentOverlay = false, heroBackground, customHeader = false }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  const scrollClasses = noScroll 
    ? 'overflow-y-visible max-h-none' 
    : 'max-h-[90vh] overflow-y-auto'

  const overlayClasses = heroBackground
    ? 'fixed inset-0 z-40 flex items-center justify-center relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-white before:via-white/85 before:to-white/40 before:z-0'
    : transparentOverlay
        ? 'fixed inset-0 bg-transparent z-40'
        : 'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn'

  const overlayStyle = heroBackground
    ? {
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined

  const contentBgClasses = heroBackground ? 'bg-white/95 backdrop-blur-md' : 'bg-white'

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlayClasses} style={overlayStyle} />
        <Dialog.Content
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${contentBgClasses} rounded-lg shadow-2xl z-50 w-full ${sizeClasses[size]} ${noScroll ? 'max-h-[90vh] overflow-hidden' : scrollClasses} animate-slideUp flex flex-col ${noScroll ? '' : 'max-h-[90vh]'}`}
        >
          {title && (
            <div className={`px-6 py-4 border-b border-gray-200 flex-shrink-0 ${heroBackground ? 'bg-white/80 backdrop-blur-sm' : 'bg-white'} z-10`}>
              <Dialog.Title className="text-xl font-bold text-gray-900">{title}</Dialog.Title>
              <Dialog.Description className="sr-only">
                {title}
              </Dialog.Description>
            </div>
          )}
          {!title && (
            <Dialog.Description className="sr-only">
              Modal dialog
            </Dialog.Description>
          )}
          <div className={`${customHeader ? 'p-0' : 'p-6'} flex-1 ${noScroll ? 'overflow-hidden' : 'overflow-y-auto'} ${heroBackground ? 'bg-white/80 backdrop-blur-sm rounded-lg' : ''}`}>{children}</div>
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

