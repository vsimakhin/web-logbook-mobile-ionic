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
    getFlightRecordsCount();
  });

  const getFlightRecordsCount = async () => {
    const db = new DBModel();
    await db.initDBConnection();
    const frCount = await db.getFlightRecordsCount();

    setFlightRecordsSyncTitle(`Flight records (${frCount} records)`);
  }

  const saveSettings = async (appSettings: AppSettings) => {
    await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(appSettings) });
  };

  const FlightRecordsUpdate = async () => {
    const sync = new Sync(settings);
    setIsSync(true);
    await sync.syncDeletedItems();
    await sync.updateFlightRecords();
    await getFlightRecordsCount();
    setIsSync(false);
  };

  const AirportsDBUpdate = async () => {
    console.log(1111)
    const db = new DBModel();
    await db.initDBConnection();
    const rr = await db.getFlightRecords();
    console.log(rr)

    await getFlightRecordsCount();
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
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Settings</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonList>
          <IonItemGroup>
            <IonItemDivider>
              <IonLabel>Settings</IonLabel>
            </IonItemDivider>
            <IonItem>
              <IonIcon icon={server} slot="start"></IonIcon>
              <IonInput label="Server" placeholder="Main app address" value={settings.url} onIonChange={serverAddressChange} ></IonInput>
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
                  <IonInput label="Username" placeholder="Username" value={settings.user} onIonChange={userNameChange}></IonInput>
                </IonItem>
                <IonItem>
                  <IonIcon icon={paw} slot="start"></IonIcon>
                  <IonInput label="Password" type="password" placeholder="Password" value={settings.pwd} onIonChange={pwdChange}></IonInput>
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
              <IonInput label={flightRecordsSyncTitle} readonly={true}></IonInput>
              <IonButton onClick={FlightRecordsUpdate} disabled={isSync}>Update</IonButton>
            </IonItem>
            <IonItem>
              <IonIcon icon={reorderFour} slot="start"></IonIcon>
              <IonInput label="Airports" readonly={true}></IonInput>
              <IonButton onClick={AirportsDBUpdate} disabled={isSync}>Update</IonButton>
            </IonItem>
          </IonItemGroup>
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
