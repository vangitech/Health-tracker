import { useMemo } from 'react';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonChip, IonAvatar } from '@ionic/react';
import { logOutOutline, menuOutline, personCircleOutline, chevronBackOutline } from 'ionicons/icons';
import { AppLogo } from './AppLogo';
import { Capacitor } from '@capacitor/core';

const platform = Capacitor.getPlatform();

export default function NativeHeader({
  title,
  onBack,
  onMenu,
  showBack = false,
  showMenu = false,
  showProfile = true,
  user = null,
  displayName = '',
  onLogout,
  rightContent,
  translucent = platform === 'ios',
  className = '',
}) {
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  const headerClass = useMemo(() => {
    const classes = ['ion-no-border'];
    if (translucent) classes.push('header-translucent');
    if (isIOS) classes.push('header-ios');
    if (isAndroid) classes.push('header-android');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [translucent, isIOS, isAndroid, className]);

  return (
    <IonHeader translucent={translucent} className={headerClass}>
      <IonToolbar className={`px-1 ${isIOS ? 'toolbar-ios' : 'toolbar-md'}`}>
        <div slot="start" className="flex items-center gap-1">
          {showBack && onBack && (
            <IonButton fill="clear" onClick={onBack} className="native-nav-btn">
              <IonIcon slot="icon-only" icon={chevronBackOutline} className="size-5" />
            </IonButton>
          )}
          {showMenu && onMenu && (
            <IonButton fill="clear" onClick={onMenu} className="native-nav-btn">
              <IonIcon slot="icon-only" icon={menuOutline} className="size-5" />
            </IonButton>
          )}
          <AppLogo size={isIOS ? 30 : 32} showText={!isAndroid} />
        </div>

        {title && (
          <IonTitle className={`text-[15px] font-bold ${isIOS ? 'ios-title' : 'md-title'}`}>
            {title}
          </IonTitle>
        )}

        <div slot="end" className="flex items-center gap-1">
          {rightContent}
          {showProfile && user && (
            <>
              <IonChip className="ion-no-padding native-profile-chip" outline={true}>
                <IonAvatar className="native-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" />
                  ) : (
                    <IonIcon icon={personCircleOutline} className="size-full text-zinc-400" />
                  )}
                </IonAvatar>
                <span className="text-[13px] font-semibold text-zinc-100 max-w-[90px] truncate hidden sm:block">
                  {displayName}
                </span>
              </IonChip>
              {onLogout && (
                <IonButton onClick={onLogout} className="ion-no-padding native-logout-btn" title="Sign Out">
                  <IonIcon slot="icon-only" icon={logOutOutline} className="size-[18px]" />
                </IonButton>
              )}
            </>
          )}
        </div>
      </IonToolbar>
    </IonHeader>
  );
}
