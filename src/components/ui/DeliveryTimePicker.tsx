import { useState, useRef, useEffect } from 'react'

interface DeliveryTimePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  onScheduleClick?: () => void
  onNowClick?: () => void
  className?: string
  idleLabel?: string
  nowOptionLabel?: string
  scheduleOptionLabel?: string
  selectedLabel?: string
}

export function DeliveryTimePicker({
  value,
  onChange,
  onScheduleClick,
  onNowClick,
  className = "",
  idleLabel = "Livrer maintenant",
  nowOptionLabel = "Livrer maintenant",
  scheduleOptionLabel = "Programmer",
  selectedLabel,
}: DeliveryTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Fermer le picker si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleDeliverNow = () => {
    if (onNowClick) {
      onNowClick()
    } else {
      onChange(null)
    }
    setIsOpen(false)
  }

  const handleSchedule = () => {
    setIsOpen(false)
    if (onScheduleClick) {
      onScheduleClick()
    }
  }

  const formatDateTime = (date: Date): string => {
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
    const day = date.getDate()
    const monthName = date.toLocaleDateString('fr-FR', { month: 'long' })
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    // Capitaliser la première lettre du jour et du mois
    const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1)
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1)
    return `${capitalizedDayName} ${day} ${capitalizedMonthName} ${year} à ${hours}:${minutes}`
  }

  const displayText = value 
    ? selectedLabel || formatDateTime(value)
    : idleLabel

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-transparent shadow-none px-0 py-0 flex items-center gap-2 hover:shadow-none transition-all"
      >
        <svg className="w-4 h-4 md:w-5 md:h-5 text-[#121212]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="flex-1 text-left text-xs md:text-sm font-medium text-[#121212]">
          {displayText}
        </span>
        <svg className={`w-3 h-3 md:w-4 md:h-4 text-[#121212] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 min-w-[200px] overflow-hidden">
          <button
            type="button"
            onClick={handleDeliverNow}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
          >
            <svg className="w-5 h-5 text-[#121212]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-[#121212]">{nowOptionLabel}</span>
          </button>
          <button
            type="button"
            onClick={handleSchedule}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
          >
            <svg className="w-5 h-5 text-[#121212]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-[#121212]">{scheduleOptionLabel}</span>
          </button>
        </div>
      )}
    </div>
  )
}

