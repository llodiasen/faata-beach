import { useState, useEffect, useRef } from 'react'
import Modal from '../ui/Modal'
import { useModalStore } from '../../store/useModalStore'

interface ScheduleTimeModalProps {
  value?: Date | null
  onChange: (date: Date | null) => void
}

export function ScheduleTimeModal({ value, onChange }: ScheduleTimeModalProps) {
  const { currentModal, closeModal } = useModalStore()
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  const [isDateOpen, setIsDateOpen] = useState(false)
  const [isTimeOpen, setIsTimeOpen] = useState(false)
  const dateRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLDivElement>(null)

  const isOpen = currentModal === 'scheduleTime'

  // Initialiser avec la valeur actuelle
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedDate(date.toISOString().split('T')[0])
      // Extraire l'heure pour déterminer le créneau
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      setSelectedTimeSlot(timeStr)
    } else {
      const today = new Date()
      setSelectedDate(today.toISOString().split('T')[0])
      setSelectedTimeSlot('')
    }
  }, [value, isOpen])

  // Fermer les dropdowns si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setIsDateOpen(false)
      }
      if (timeRef.current && !timeRef.current.contains(event.target as Node)) {
        setIsTimeOpen(false)
      }
    }

    if (isDateOpen || isTimeOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDateOpen, isTimeOpen])

  // Convertir heure 24h en 12h
  const formatTime12h = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  // Générer les créneaux horaires (toutes les 30 minutes de 8h à 22h)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const endHour = minute === 30 ? hour + 1 : hour
        const endMinute = minute === 30 ? 0 : 30
        slots.push({
          start: timeStr,
          end: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
          display: `${formatTime12h(hour, minute)} - ${formatTime12h(endHour, endMinute)}`
        })
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Générer les dates disponibles (aujourd'hui + 7 jours)
  const generateAvailableDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 8; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  // Formater la date pour l'affichage
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    
    const today = new Date()
    const isToday = dateStr === today.toISOString().split('T')[0]
    
    if (isToday) {
      return `Aujourd'hui, ${dayName}, ${day} ${month}`
    }
    
    return `${dayName}, ${day} ${month}`
  }

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr)
    setIsDateOpen(false)
  }

  const handleTimeSlotChange = (slot: string) => {
    setSelectedTimeSlot(slot)
    setIsTimeOpen(false)
  }

  const handleSchedule = () => {
    if (selectedDate && selectedTimeSlot) {
      const [hours, minutes] = selectedTimeSlot.split(':').map(Number)
      const dateTime = new Date(selectedDate)
      dateTime.setHours(hours, minutes, 0, 0)
      onChange(dateTime)
      closeModal()
    }
  }

  const handleDeliverNow = () => {
    onChange(null)
    closeModal()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Choisir une heure"
      size="sm"
      transparentOverlay={true}
    >
      <div className="space-y-4">
        {/* Date Selection */}
        <div className="relative" ref={dateRef}>
          <button
            type="button"
            onClick={() => {
              setIsDateOpen(!isDateOpen)
              setIsTimeOpen(false)
            }}
            className="w-full px-4 py-3 bg-gray-100 rounded-lg text-left text-base text-[#39512a] hover:bg-gray-200 transition-colors flex items-center justify-between"
          >
            <span>{selectedDate ? formatDateDisplay(selectedDate) : 'Sélectionner une date'}</span>
            <svg className={`w-4 h-4 text-[#39512a] transition-transform ${isDateOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isDateOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-10">
              {generateAvailableDates().map((dateStr) => (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDateSelect(dateStr)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    selectedDate === dateStr ? 'bg-gray-100' : ''
                  }`}
                >
                  <span className="text-sm text-[#39512a]">{formatDateDisplay(dateStr)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time Selection */}
        <div className="relative" ref={timeRef}>
          <button
            type="button"
            onClick={() => {
              setIsTimeOpen(!isTimeOpen)
              setIsDateOpen(false)
            }}
            className="w-full px-4 py-3 bg-gray-100 rounded-lg text-left text-base text-[#39512a] hover:bg-gray-200 transition-colors flex items-center justify-between"
          >
            <span>
              {selectedTimeSlot ? (
                timeSlots.find(s => s.start === selectedTimeSlot)?.display || selectedTimeSlot
              ) : (
                <span className="text-gray-500">Sélectionner un créneau</span>
              )}
            </span>
            <svg className={`w-4 h-4 text-[#39512a] transition-transform ${isTimeOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isTimeOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-10">
              {timeSlots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => handleTimeSlotChange(slot.start)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    selectedTimeSlot === slot.start ? 'bg-gray-100' : ''
                  }`}
                >
                  <span className="text-sm text-[#39512a]">{slot.display}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleSchedule}
            disabled={!selectedDate || !selectedTimeSlot}
            className="w-full bg-[#39512a] text-white py-2 px-3 rounded-lg font-medium text-sm hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Programmer
          </button>
          <button
            type="button"
            onClick={handleDeliverNow}
            className="w-full bg-gray-100 text-[#39512a] py-3 rounded-lg font-medium text-base hover:bg-gray-200 transition-colors"
          >
            Livrer maintenant
          </button>
        </div>
      </div>
    </Modal>
  )
}

