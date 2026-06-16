import { IonPage, IonContent, IonRefresher, IonRefresherContent } from '@ionic/react';
import Footer from './Footer';

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
        <Footer minimal />
      </IonContent>
    </IonPage>
  );
}
