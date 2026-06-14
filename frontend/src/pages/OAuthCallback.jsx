import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { IonPage, IonContent, IonIcon } from '@ionic/react'
import { syncOutline } from 'ionicons/icons'

export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleOAuthToken } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      handleOAuthToken(token)
      navigate('/', { replace: true })
    } else {
      setError('No authentication token received.')
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    }
  }, [])

  return (
    <IonPage>
      <IonContent className="ion-justify-content-center ion-align-items-center">
        <div className="flex items-center justify-center min-h-full bg-black">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : (
            <IonIcon icon={syncOutline} className="size-8 text-white/60 animate-spin" />
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}
