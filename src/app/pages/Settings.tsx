import {
  IonButton, IonCheckbox, IonContent, IonHeader, IonIcon, IonInput, IonItem,
  IonItemDivider, IonItemGroup, IonLabel, IonList, IonPage, IonProgressBar, IonTitle, IonToolbar, useIonViewDidEnter,
} from '@ionic/react';
import { airplane, build, paw, personCircle, reorderFour, server } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { useEffect, useState } from 'react';
import { AppSettings } from '../interfaces/Interfaces';
import { Sync } from '../modules/sync/Sync';
import { DBModel } from '../modules/db/DBModel';
import { Toast } from '@capacitor/toast';

const SETTINGS_KEY = 'SETTINGS_KET';

const Settings: React.FC = () => {

  const [settings, setSettings] = useState<AppSettings>({
    url: "",
    user: "",
    pwd: "",
    auth: true,
  });

  const [isSync, setIsSync] = useState(false);
  const [flightRecordsSyncTitle, setFlightRecordsSyncTitle] = useState('Flight records')
  const [airportsUpdateTitle, setAirportsUpdateTitle] = useState('Airports');

  const loadData = async () => {
    const { value } = await Preferences.get({ key: SETTINGS_KEY });
    if (value) {
      const appSettings = JSON.parse(value) as AppSettings;
      setSettings(appSettings);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useIonViewDidEnter(() => {
    getRecordsCount();
  });

  const getRecordsCount = async () => {
    const db = new DBModel();
    await db.initDBConnection();

    const frCount = await db.getFlightRecordsCount();
    const airports = await db.getAirportsCount();

    setFlightRecordsSyncTitle(`Flight records (${frCount} records)`);
    setAirportsUpdateTitle(`Airports (${airports} records)`);
  }

  /**
   * Saves settings to the storage
   * @param appSettings 
   */
  const saveSettings = async (appSettings: AppSettings) => {
    await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(appSettings) });
  };

  /**
   * Runs synchronization of flight records with the main app.
   */
  const FlightRecordsUpdate = async () => {
    const sync = new Sync(settings);
    setIsSync(true);

    await Toast.show({ text: `Synchronizing deleted records...` });
    await sync.syncDeletedItems();

    await Toast.show({ text: `Synchronizing flight records...` });
    await sync.updateFlightRecords();

    await getRecordsCount();

    await Toast.show({ text: `Synchronization completed` });
    setIsSync(false);
  };

  const AirportsDBUpdate = async () => {
    const sync = new Sync(settings);
    setIsSync(true);

    await Toast.show({ text: `Updating airports database...` });
    await sync.updateAirportsDB();

    await getRecordsCount();
    await Toast.show({ text: `Airports database updated` });

    setIsSync(false);

  };

  const AuthCheckClicked = async (e: any) => {
    setSettings({ ...settings, auth: e.target.checked });
    await saveSettings({ ...settings, auth: e.target.checked });
  }

  const serverAddressChange = async (e: any) => {
    setSettings({ ...settings, url: e.target.value });
    await saveSettings({ ...settings, url: e.target.value });
  };

  const userNameChange = async (e: any) => {
    setSettings({ ...settings, user: e.target.value });
    await saveSettings({ ...settings, user: e.target.value });
  };

  const pwdChange = async (e: any) => {
    setSettings({ ...settings, pwd: e.target.value });
    await saveSettings({ ...settings, pwd: e.target.value });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
          {isSync &&
            <IonProgressBar type="indeterminate"></IonProgressBar>
          }
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList>
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>Settings</IonLabel>
            </IonItemDivider>
            <IonItem>
              <IonIcon icon={server} slot="start"></IonIcon>
              <IonInput label="Server" placeholder="Main app address" value={settings.url} onIonInput={serverAddressChange} ></IonInput>
            </IonItem>
            <IonItem>
              <IonIcon icon={build} slot="start"></IonIcon>
              <IonCheckbox checked={settings.auth} onIonChange={AuthCheckClicked}>Use authentication</IonCheckbox>
            </IonItem>
            {
              settings.auth &&
              <>
                <IonItem>
                  <IonIcon icon={personCircle} slot="start"></IonIcon>
                  <IonInput label="Username" placeholder="Username" value={settings.user} onIonInput={userNameChange}></IonInput>
                </IonItem>
                <IonItem>
                  <IonIcon icon={paw} slot="start"></IonIcon>
                  <IonInput label="Password" type="password" placeholder="Password" value={settings.pwd} onIonInput={pwdChange}></IonInput>
                </IonItem>
              </>
            }
          </IonItemGroup>
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>Synchronization</IonLabel>
            </IonItemDivider>
            <IonItem>
              <IonIcon icon={airplane} slot="start"></IonIcon>
              <IonLabel>{flightRecordsSyncTitle}</IonLabel>
              <IonButton onClick={FlightRecordsUpdate} disabled={isSync}>Update</IonButton>
            </IonItem>
            <IonItem>
              <IonIcon icon={reorderFour} slot="start"></IonIcon>
              <IonLabel>{airportsUpdateTitle}</IonLabel>
              <IonButton onClick={AirportsDBUpdate} disabled={isSync}>Update</IonButton>
            </IonItem>
          </IonItemGroup>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
