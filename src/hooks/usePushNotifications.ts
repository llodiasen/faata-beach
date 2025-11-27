import { useCallback, useEffect, useMemo, useState } from 'react'
import { pushAPI } from '../lib/api'

const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

const convertBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(() => (typeof window !== 'undefined' ? Notification.permission : 'default'))
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = useMemo(
    () =>
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window,
    [],
  )

  useEffect(() => {
    if (!isSupported) return
    let mounted = true

    const loadSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        const currentSubscription = await registration.pushManager.getSubscription()
        if (mounted) {
          setSubscription(currentSubscription)
        }
      } catch (err) {
        console.error('Erreur lors du chargement de la subscription push', err)
      }
    }

    loadSubscription()

    return () => {
      mounted = false
    }
  }, [isSupported])

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError("Les notifications push ne sont pas supportées par ce navigateur")
      return 'denied'
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [isSupported])

  const subscribeToPush = useCallback(
    async (tags?: string[]) => {
      setError(null)
      if (!isSupported) {
        setError("Les notifications push ne sont pas supportées par ce navigateur")
        return null
      }
      if (!vapidPublicKey) {
        setError('Clé VAPID publique manquante. Ajoutez VITE_VAPID_PUBLIC_KEY à votre configuration.')
        return null
      }
      if (permission === 'default') {
        const requested = await requestPermission()
        if (requested !== 'granted') {
          setError('Permission de notification refusée')
          return null
        }
      } else if (permission === 'denied') {
        setError('Permission de notification refusée au niveau du navigateur')
        return null
      }

      setIsProcessing(true)
      try {
        const registration = await navigator.serviceWorker.ready
        let currentSubscription = await registration.pushManager.getSubscription()

        if (!currentSubscription) {
          currentSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertBase64ToUint8Array(vapidPublicKey),
          })
        }

        await pushAPI.subscribe({
          subscription: currentSubscription.toJSON(),
          tags,
          deviceInfo: {
            platform: (navigator as any)?.userAgentData?.platform || navigator.platform,
            browser: navigator.userAgent,
          },
        })

        setSubscription(currentSubscription)
        return currentSubscription
      } catch (err) {
        console.error('Erreur abonnement push', err)
        setError(err instanceof Error ? err.message : 'Impossible de s’abonner aux notifications')
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [isSupported, permission, requestPermission],
  )

  const unsubscribeFromPush = useCallback(async () => {
    if (!isSupported || !subscription) {
      return false
    }

    setIsProcessing(true)
    setError(null)

    try {
      await pushAPI.unsubscribe({ endpoint: subscription.endpoint })
      const success = await subscription.unsubscribe()
      if (success) {
        setSubscription(null)
      }
      return success
    } catch (err) {
      console.error('Erreur désabonnement push', err)
      setError(err instanceof Error ? err.message : 'Impossible de se désabonner des notifications')
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [isSupported, subscription])

  return {
    isSupported,
    permission,
    subscription,
    isSubscribed: Boolean(subscription),
    isProcessing,
    error,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
  }
}

