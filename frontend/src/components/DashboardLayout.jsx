import { IonPage, IonContent, IonRefresher, IonRefresherContent, IonFooter } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import Footer from './Footer';
import WebFooter from './WebFooter';

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
        {isNative ? (
          children
        ) : (
          <div className="flex flex-col min-h-full">
            <div className="flex-1">
              {children}
            </div>
            <WebFooter />
          </div>
        )}
      </IonContent>
      {isNative && (
        <IonFooter className="ion-no-border">
          <Footer />
        </IonFooter>
      )}
    </IonPage>
  );
}
