import { IonPage, IonContent } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import Footer from './Footer';

const isNative = Capacitor.isNativePlatform();

export default function AuthLayout({ children }) {
  return (
    <IonPage className="auth-page">
      <IonContent scrollY={true} className="ion-no-padding">
        {children}
        {!isNative && <Footer />}
      </IonContent>
    </IonPage>
  );
}
