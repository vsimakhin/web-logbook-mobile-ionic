import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { airplane, barChart, cog } from 'ionicons/icons';

import { SQLiteHook, useSQLite } from 'react-sqlite-hook';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import FlightRecords from './app/pages/FlightRecords';
import Stats from './app/pages/Stats';
import Settings from './app/pages/Settings';

setupIonicReact();

export let sqlite: SQLiteHook;

const App: React.FC = () => {

  sqlite = useSQLite();

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/flightrecords">
              <FlightRecords />
            </Route>
            <Route exact path="/stats">
              <Stats />
            </Route>
            <Route path="/settings">
              <Settings />
            </Route>
            <Route exact path="/">
              <Redirect to="/flightrecords" />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="flightrecords" href="/flightrecords">
              <IonIcon aria-hidden="true" icon={airplane} />
              <IonLabel>Flight Records</IonLabel>
            </IonTabButton>
            <IonTabButton tab="stats" href="/stats">
              <IonIcon aria-hidden="true" icon={barChart} />
              <IonLabel>Stats</IonLabel>
            </IonTabButton>
            <IonTabButton tab="settings" href="/settings">
              <IonIcon aria-hidden="true" icon={cog} />
              <IonLabel>Settings</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  )
};

export default App;
