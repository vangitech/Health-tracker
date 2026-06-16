import { IonPage, IonContent } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import WebFooter from './WebFooter';

const isNative = Capacitor.isNativePlatform();

export default function AuthLayout({ children }) {
  return (
    <IonPage className="auth-page">
      <IonContent scrollY={true} className="ion-no-padding">
        {children}
        {!isNative && <WebFooter />}
      </IonContent>
    </IonPage>
  );
}
