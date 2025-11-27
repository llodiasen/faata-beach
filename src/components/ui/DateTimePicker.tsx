import { useState, useRef, useEffect } from 'react'

interface DateTimePickerProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  className?: string
}

export function DateTimePicker({ value, onChange, placeholder = "Sélectionner date et heure", className = "" }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const pickerRef = useRef<HTMLDivElement>(null)

  // Initialiser avec la valeur actuelle
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedDate(date.toISOString().split('T')[0])
      setSelectedTime(date.toTimeString().slice(0, 5))
    } else {
      setSelectedDate('')
      setSelectedTime('')
    }
  }, [value])

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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    if (e.target.value && selectedTime) {
      const dateTime = new Date(`${e.target.value}T${selectedTime}`)
      onChange(dateTime)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTime(e.target.value)
    if (selectedDate && e.target.value) {
      const dateTime = new Date(`${selectedDate}T${e.target.value}`)
      onChange(dateTime)
    }
  }

  const handleClear = () => {
    setSelectedDate('')
    setSelectedTime('')
    onChange(null)
    setIsOpen(false)
  }

  const formatDisplayValue = () => {
    if (value) {
      const date = new Date(value)
      const dateStr = date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric'
      })
      const timeStr = date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      return `${dateStr} à ${timeStr}`
    }
    return placeholder
  }

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white rounded-full shadow-lg px-4 py-3 flex items-center gap-2 min-w-[200px] hover:shadow-xl transition-all"
      >
        <svg className="w-5 h-5 text-[#121212]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="flex-1 text-left text-sm font-medium text-[#121212]">
          {formatDisplayValue()}
        </span>
        <svg className={`w-4 h-4 text-[#121212] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[320px]">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                min={minDate}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a] focus:border-transparent text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Heure
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#39512a] focus:border-transparent text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Effacer
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#39512a] hover:bg-[#2f3d1f] rounded-lg transition-colors"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

