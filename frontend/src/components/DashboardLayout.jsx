import { IonPage, IonContent, IonRefresher, IonRefresherContent, IonFooter } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import Footer from './Footer';

const isNative = Capacitor.isNativePlatform();

export default function DashboardLayout({
  children,
  header,
  onRefresh,
}) {
  return (
    <IonPage>
      {header}
      <IonContent fullscreen={isNative}>
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
      </IonContent>
      <IonFooter className="ion-no-border">
        <Footer />
      </IonFooter>
    </IonPage>
  );
}
