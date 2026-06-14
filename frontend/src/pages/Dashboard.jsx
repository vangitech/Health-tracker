import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from '../lib/axios';
import {
  IonPage, IonHeader, IonToolbar, IonContent,
  IonButton, IonIcon, IonRefresher, IonRefresherContent,
  IonCard, IonCardContent, IonNote,
  IonGrid, IonRow, IonCol, IonAvatar, IonChip, IonRippleEffect,
} from '@ionic/react';
import MonthlyTableView from '../components/MonthlyTableView';
import { AppLogo } from '../components/AppLogo';
import {
  logOutOutline, pulseOutline, trendingUpOutline,
  checkmarkCircleOutline, alertCircleOutline, personCircleOutline,
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
    if (!a1c) return 'text-zinc-500';
    if (a1c < 7) return 'text-emerald-400';
    if (a1c < 8) return 'text-amber-400';
    return 'text-rose-400';
  };

  const StatCard = ({ title, value, unit, note, icon, iconColor, gradient, children }) => (
    <IonCol size="6" sizeMd="3">
      <IonCard className={`m-0 mb-3 native-statcard ${gradient || ''}`}>
        <IonRippleEffect />
        <IonCardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em]">
              {title}
            </span>
            <div className={`size-8 rounded-xl ${iconColor} flex items-center justify-center`}>
              <IonIcon icon={icon} className={`size-4 ${iconColor.replace('bg-', 'text-').replace('/20', '').replace('/15', '')}`} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold text-white tracking-tight leading-none">
              {value ?? '—'}
            </span>
            {unit && <span className="text-[11px] font-semibold text-zinc-500">{unit}</span>}
          </div>
          <IonNote className="text-[11px] text-zinc-600 mt-2 block leading-snug">
            {note}
          </IonNote>
          {children}
        </IonCardContent>
      </IonCard>
    </IonCol>
  );

  const StatsSkeleton = () => (
    <IonGrid className="ion-no-padding">
      <IonRow>
        {[1, 2, 3, 4].map((i) => (
          <IonCol size="6" sizeMd="3" key={i}>
            <IonCard className="m-0 mb-3 native-statcard">
              <IonCardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3 w-16 bg-zinc-800 rounded-full animate-pulse" />
                  <div className="size-8 rounded-xl bg-zinc-800 animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-zinc-800 rounded-lg animate-pulse mb-2" />
                <div className="h-3 w-28 bg-zinc-800/50 rounded-full animate-pulse" />
              </IonCardContent>
            </IonCard>
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  );

  return (
    <IonPage>
      <IonHeader translucent className="ion-no-border">
        <IonToolbar className="px-1">
          <div slot="start" className="flex items-center">
            <AppLogo />
          </div>

          <div slot="end" className="flex items-center gap-1">
            <IonChip className="ion-no-padding native-profile-chip" outline={true}>
              <IonAvatar className="native-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" />
                ) : (
                  <IonIcon icon={personCircleOutline} className="size-full text-zinc-400" />
                )}
              </IonAvatar>
              <span className="text-[13px] font-semibold text-zinc-100 max-w-[90px] truncate">
                {displayName}
              </span>
            </IonChip>
            <IonButton onClick={logout} className="ion-no-padding native-logout-btn" title="Sign Out">
              <IonIcon slot="icon-only" icon={logOutOutline} className="size-[18px]" />
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            refreshingSpinner="crescent"
            refreshingText=""
            pullText=""
            className="refresher-custom"
          />
        </IonRefresher>

        <div className="px-4 pt-3 pb-6">
          {loading ? (
            <StatsSkeleton />
          ) : trends ? (
            <>
              <IonGrid className="ion-no-padding">
                <IonRow>
                  <StatCard
                    title="Avg Glucose"
                    value={trends.averageGlucose}
                    unit="mmol/L"
                    note="Latest glucose average"
                    icon={pulseOutline}
                    iconColor="bg-sky-500/15"
                  />
                  <StatCard
                    title="Est. A1C"
                    value={trends.estimatedA1C ? `${trends.estimatedA1C}%` : null}
                    note="Estimated 3-month control"
                    icon={trendingUpOutline}
                    iconColor="bg-violet-500/15"
                    gradient="card-a1c"
                  />
                  <StatCard
                    title="In Range"
                    value={trends.inRangeCount ?? 0}
                    note={`of ${trends.totalEntries ?? 0} total readings`}
                    icon={checkmarkCircleOutline}
                    iconColor="bg-emerald-500/15"
                  />
                  <StatCard
                    title="Readings"
                    note="High / Borderline / Low"
                    icon={alertCircleOutline}
                    iconColor="bg-amber-500/15"
                  >
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 text-[10px] font-semibold">
                        <span className="size-1.5 rounded-full bg-rose-400" />
                        {trends.highCount ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 text-[10px] font-semibold">
                        <span className="size-1.5 rounded-full bg-amber-400" />
                        {trends.borderlineCount ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 text-[10px] font-semibold">
                        <span className="size-1.5 rounded-full bg-cyan-400" />
                        {trends.lowCount ?? 0}
                      </span>
                    </div>
                  </StatCard>
                </IonRow>
              </IonGrid>
            </>
          ) : null}

          <MonthlyTableView entries={entries} onDataChange={handleDataChange} />
        </div>
      </IonContent>
    </IonPage>
  );
}
