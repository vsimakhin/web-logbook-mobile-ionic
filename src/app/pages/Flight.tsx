import { IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonItemDivider, IonItemGroup, IonList, IonPage, IonRow, IonTitle, IonToolbar, useIonViewDidEnter, useIonViewWillEnter } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { FlightRecord, emptyFlightRecord } from '../interfaces/Interfaces';
import { checkmark, close } from 'ionicons/icons';


const Flight: React.FC = () => {
  // let fr: FlightRecord = emptyFlightRecord();

  const location = useLocation();
  const [fr, setFlightRecord] = useState<FlightRecord>(emptyFlightRecord);

  useEffect(() => {
    console.log(location)
    const state = location.state as { fr: FlightRecord };
    if (state !== undefined) {
      setFlightRecord(state.fr);
      console.log(state)
    }
  }, [location.state])

  // useIonViewDidEnter(() => {
  //   const state = location.state as { fr: FlightRecord };
  //   if (state !== undefined) {
  //     setFlightRecord(state.fr);
  //   }
  // });

  // const state = location.state as { fr: FlightRecord };
  // if (state !== undefined) {
  //   fr = state.fr;
  //   console.log(state)
  // }

  const getTitle = (fr: FlightRecord): string => {
    if (fr.departure_place !== "" && fr.arrival_place !== "") {
      return `${fr.departure_place} - ${fr.arrival_place}`;
    } else if (fr.departure_place !== "" && fr.arrival_place === "") {
      return fr.departure_place;
    } else if (fr.departure_place === "" && fr.arrival_place !== "") {
      return fr.arrival_place;
    } else if (fr.sim_type !== "") {
      return fr.sim_type
    } else {
      return 'Flight';
    }
  }



  const [title, setTitle] = useState(getTitle(fr));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="#"></IonBackButton>
          </IonButtons>
          <IonButtons slot="secondary">
            <IonButton >
              <IonIcon slot="icon-only" icon={checkmark} onClick={(e) => { fr.se_time = fr.total_time; setFlightRecord(fr) }}></IonIcon>
            </IonButton>
            <IonButton>
              <IonIcon slot="icon-only" icon={close}></IonIcon>
            </IonButton>
          </IonButtons>
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Date" labelPlacement="stacked" placeholder="DD/MM/YYYY" value={fr.date}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Pilot in Command" labelPlacement="stacked" placeholder="Pilot in Command" value={fr.pic_name}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Departure Place" labelPlacement="stacked" placeholder="Departure Place" value={fr.departure_place}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Departure Time" labelPlacement="stacked" placeholder="HHMM" value={fr.departure_time}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Arrival Place" labelPlacement="stacked" placeholder="Arrival Place" value={fr.arrival_place}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Arrival Time" labelPlacement="stacked" placeholder="HHMM" value={fr.arrival_time}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Aircraft Model" labelPlacement="stacked" placeholder="Aircraft Model" value={fr.aircraft_model}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Aircraft Registration" labelPlacement="stacked" placeholder="Aircraft Registration" value={fr.reg_name}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Total Time" labelPlacement="stacked" placeholder="HH:MM" value={fr.total_time}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Day" labelPlacement="stacked" placeholder="Day" value={fr.day_landings}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Night" labelPlacement="stacked" placeholder="Night" value={fr.night_landings}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="SE" labelPlacement="stacked" placeholder="HH:MM" value={fr.se_time}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="ME" labelPlacement="stacked" placeholder="HH:MM" value={fr.me_time}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="MCC" labelPlacement="stacked" placeholder="HH:MM" value={fr.mcc_time}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Night" labelPlacement="stacked" placeholder="HH:MM" value={fr.night_time}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="IFR" labelPlacement="stacked" placeholder="HH:MM" value={fr.ifr_time}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="PIC" labelPlacement="stacked" placeholder="HH:MM" value={fr.pic_time}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Co Pilot" labelPlacement="stacked" placeholder="HH:MM" value={fr.co_pilot_time}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Dual" labelPlacement="stacked" placeholder="HH:MM" value={fr.dual_time}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Instr" labelPlacement="stacked" placeholder="HH:MM" value={fr.instructor_time}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Sim Type" labelPlacement="stacked" placeholder="Simulator Type" value={fr.sim_type}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Sim Time" labelPlacement="stacked" placeholder="HH:MM" value={fr.sim_time}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Remarks" labelPlacement="stacked" placeholder="Remarks" value={fr.remarks}></IonInput>
              </IonItem>
            </IonCol>

          </IonRow>
        </IonGrid>


        {/* <IonButton onClick={() => history.goBack()} /> */}
      </IonContent>
    </IonPage >
  );
};

export default Flight;
