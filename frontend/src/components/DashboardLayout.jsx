import { IonPage, IonContent, IonRefresher, IonRefresherContent } from '@ionic/react';
import Footer from './Footer';

export default function DashboardLayout({
  children,
  header,
  onRefresh,
}) {
  return (
    <IonPage>
      {header}
      <IonContent fullscreen>
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
        <div className="flex flex-col min-h-full">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </IonContent>
    </IonPage>
  );
}
