import { IonPage, IonContent, IonRefresher, IonRefresherContent } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import Footer from './Footer';

const isNative = Capacitor.isNativePlatform();

export default function DashboardLayout({
  children,
  header,
  onRefresh,
  fullscreen = true,
}) {
  return (
    <IonPage>
      {header}
      <IonContent fullscreen={fullscreen}>
        {onRefresh && (
          <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
            <IonRefresherContent
              refreshingSpinner="crescent"
              refreshingText=""
              pullText=""
              className="refresher-custom"
            />
          </IonRefresher>
        )}
        {children}
        {!isNative && <Footer minimal />}
      </IonContent>
    </IonPage>
  );
}
