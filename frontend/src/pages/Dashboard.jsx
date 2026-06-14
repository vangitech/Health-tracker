import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from '../lib/axios';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonRefresher, IonRefresherContent,
  IonCard, IonCardContent, IonAvatar, IonLabel, IonNote,
  IonGrid, IonRow, IonCol, IonBadge,
} from '@ionic/react';
import MonthlyTableView from '../components/MonthlyTableView';
import {
  logOutOutline, pulseOutline, refreshOutline, personCircleOutline,
  trendingUpOutline, checkmarkCircleOutline, alertCircleOutline
} from 'ionicons/icons';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState([]);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [entriesRes, trendsRes] = await Promise.all([
        axios.get('/api/entries'),
        axios.get('/api/trends?days=30')
      ]);
      setEntries(entriesRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async (event) => {
    await fetchData();
    event.detail.complete();
  };

  const handleDataChange = () => {
    fetchData();
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`
    : user?.email;

  const getA1CColor = (a1c) => {
    if (!a1c) return 'text-zinc-400';
    if (a1c < 7) return 'text-emerald-400';
    if (a1c < 8) return 'text-amber-400';
    return 'text-rose-400';
  };

  const StatsSkeleton = () => (
    <IonGrid className="ion-no-padding">
      <IonRow>
        {[1, 2, 3, 4].map((i) => (
          <IonCol size="6" sizeMd="3" key={i}>
            <IonCard className="m-0 mb-3">
              <IonCardContent className="p-4">
                <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse mb-3" />
                <div className="h-7 w-24 bg-zinc-800 rounded animate-pulse mb-2" />
                <div className="h-3 w-32 bg-zinc-800/50 rounded animate-pulse" />
              </IonCardContent>
            </IonCard>
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  );

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonAvatar slot="start" className="size-9">
            {user?.avatar ? (
              <img src={user.avatar} alt="" />
            ) : (
              <IonIcon icon={personCircleOutline} className="size-9 text-zinc-400" />
            )}
          </IonAvatar>
          <IonTitle>
            <div className="flex flex-col leading-tight py-1">
              <span className="text-[15px] font-semibold">{displayName}</span>
              <span className="text-[10px] font-normal text-zinc-500 uppercase tracking-wider">Member</span>
            </div>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={logout} className="ion-no-padding">
              <IonIcon slot="icon-only" icon={logOutOutline} className="size-5" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            refreshingText="Refreshing..."
            className="[--ion-text-color:theme(colors.zinc.400)]"
          />
        </IonRefresher>

        <div className="px-4 pt-4 pb-6">
          {/* Stats Grid */}
          {loading ? (
            <StatsSkeleton />
          ) : trends ? (
            <IonGrid className="ion-no-padding">
              <IonRow>
                <IonCol size="6" sizeMd="3">
                  <IonCard className="m-0 mb-3">
                    <IonCardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <IonNote className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                          Avg Glucose
                        </IonNote>
                        <IonIcon icon={pulseOutline} className="size-4 text-sky-400 shrink-0" />
                      </div>
                      <div className="text-2xl font-semibold text-white">
                        {trends.averageGlucose ? `${trends.averageGlucose}` : '—'}
                        {trends.averageGlucose && <span className="text-xs font-normal text-zinc-500 ml-1">mmol/L</span>}
                      </div>
                      <IonNote className="text-[11px] text-zinc-600 mt-1 block">
                        Latest average
                      </IonNote>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6" sizeMd="3">
                  <IonCard className="m-0 mb-3 bg-gradient-to-br from-violet-600/20 to-zinc-900/80">
                    <IonCardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <IonNote className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                          Est. A1C
                        </IonNote>
                        <IonIcon icon={trendingUpOutline} className="size-4 text-violet-400 shrink-0" />
                      </div>
                      <div className={`text-2xl font-semibold ${getA1CColor(trends.estimatedA1C)}`}>
                        {trends.estimatedA1C ? `${trends.estimatedA1C}%` : '—'}
                      </div>
                      <IonNote className="text-[11px] text-zinc-600 mt-1 block">
                        Long-term control
                      </IonNote>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6" sizeMd="3">
                  <IonCard className="m-0 mb-3">
                    <IonCardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <IonNote className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                          In Range
                        </IonNote>
                        <IonIcon icon={checkmarkCircleOutline} className="size-4 text-emerald-400 shrink-0" />
                      </div>
                      <div className="text-2xl font-semibold text-emerald-400">
                        {trends.inRangeCount ?? 0}
                      </div>
                      <IonNote className="text-[11px] text-zinc-500 mt-1 block">
                        of {trends.totalEntries ?? 0} readings
                      </IonNote>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6" sizeMd="3">
                  <IonCard className="m-0 mb-3">
                    <IonCardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <IonNote className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                          High / Low
                        </IonNote>
                        <IonIcon icon={alertCircleOutline} className="size-4 text-amber-400 shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <IonBadge color="danger">{trends.highCount ?? 0} High</IonBadge>
                        <IonBadge color="warning">{trends.borderlineCount ?? 0} Border</IonBadge>
                        <IonBadge color="medium">{trends.lowCount ?? 0} Low</IonBadge>
                      </div>
                      <IonNote className="text-[11px] text-zinc-600 mt-2 block">
                        Risk distribution
                      </IonNote>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>
          ) : null}

          {/* Monthly Table View */}
          <MonthlyTableView entries={entries} onDataChange={handleDataChange} />
        </div>
      </IonContent>
    </IonPage>
  );
}
