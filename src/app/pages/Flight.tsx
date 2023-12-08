import {
  IonAlert,
  IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem,
  IonPage, IonRow, IonTitle, IonToolbar
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import { FlightRecord, NEW_FLIGHTRECORD, emptyFlightRecord } from '../interfaces/Interfaces';
import { checkmark, close, ticketSharp } from 'ionicons/icons';
import { DBModel } from '../modules/db/DBModel';
import { Toast } from '@capacitor/toast';
import { v4 as uuidv4 } from 'uuid';
import { getTimestamp, parseDateString } from '../modules/helpers/Helpers';
import { Place, Route, flightTime, formatDuration, nightTime, routeDistance, sunrise, sunset } from '../modules/nighttime/Nighttime';

const Flight: React.FC = () => {

  const history = useHistory();

  const location = useLocation();
  const [fr, setFlightRecord] = useState<FlightRecord>(emptyFlightRecord);


  /**
   * Returns the title for a flight record.
   * @param fr - The flight record.
   * @returns The title string.
   */
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

  useEffect(() => {
    const state = location.state as { fr: FlightRecord };
    if (state !== undefined) {
      setFlightRecord(state.fr);
      setTitle(getTitle(state.fr));
    }
  }, [location.state])

  /**
   * Saves the flight record to the database.
   * If the flight record is a new record, it creates a new entry in the database.
   * If the flight record already exists, it updates the existing entry in the database.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  const saveFlightRecord = async (): Promise<void> => {
    const db = new DBModel();
    await db.initDBConnection();

    if (fr.uuid === NEW_FLIGHTRECORD) {
      const uuid = uuidv4();
      fr.uuid = uuid;
      setFlightRecord({ ...fr, uuid: fr.uuid })

      const res = await db.insertFlightRecord(fr);
      if (res instanceof Error) {
        await Toast.show({ text: `Cannot create a new flight record ${res.message}` });
      } else {
        await Toast.show({ text: 'Flight record created' });
      }
    } else {

      fr.update_time = getTimestamp();
      const res = await db.updateFlightRecord(fr);
      if (res instanceof Error) {
        await Toast.show({ text: `Cannot update flight record ${res.message}` });
      } else {
        await Toast.show({ text: 'Flight record updated' });
      }
    }
  }

  /**
   * Deletes a flight record from the database.
   * @returns {Promise<void>} A promise that resolves when the flight record is deleted successfully.
   */
  const deleteFlightRecord = async (): Promise<void> => {
    const db = new DBModel();
    await db.initDBConnection();

    const res = await db.deleteFlightRecord(fr.uuid);
    if (res instanceof Error) {
      await Toast.show({ text: `Cannot delete flight record ${res.message}` });
    } else {
      history.goBack();
    }
  }

  /**
   * Calculates the night time for the flight record.
   */
  const calculateNightTime = async (): Promise<string> => {
    const db = new DBModel();
    await db.initDBConnection();

    const departure = await db.getAirport(fr.departure_place);
    const arrival = await db.getAirport(fr.arrival_place);
    const departureTime = parseDateString(`${fr.date} ${fr.departure_time}`);
    const arrivalTime = parseDateString(`${fr.date} ${fr.arrival_time}`);

    if ((departure instanceof Error) || (arrival instanceof Error) ||
      (departureTime instanceof Error) || (arrivalTime instanceof Error)) {
      return '';
    }

    const dep: Place = { lat: departure.lat, lon: departure.lon, time: departureTime };
    const arr: Place = { lat: arrival.lat, lon: arrival.lon, time: arrivalTime };

    // check time, arrival should be after departure
    if (arr.time < dep.time) {
      arr.time.setDate(arr.time.getDate() + 1);
    }

    const nt = nightTime({ departure: dep, arrival: arr } as Route);
    if (fr.night_time !== '') {
      return fr.night_time; // we don't want overwrite the night time if it is already set
    } else if (nt !== 0) {
      return formatDuration(nt);
    } else {
      return '';
    }
  }

  /**
   * Calculates the flight time for the flight record.
   */
  const calculateFlightTime = async (): Promise<string> => {
    const departureTime = parseDateString(`${fr.date} ${fr.departure_time}`);
    const arrivalTime = parseDateString(`${fr.date} ${fr.arrival_time}`);

    if ((departureTime instanceof Error) || (arrivalTime instanceof Error)) {
      return '';
    }

    // check time, arrival should be after departure
    if (arrivalTime < departureTime) {
      arrivalTime.setDate(arrivalTime.getDate() + 1);
    }

    const ft = arrivalTime.getTime() - departureTime.getTime();
    if (ft !== 0) {
      return formatDuration(ft);
    } else {
      return '';
    }
  }

  /**
   * Calculates the night time and the flight time for the flight record.
   * @returns {Promise<void>} A promise that resolves when the night time and the flight time are calculated.
   */
  const calculateTimes = async (): Promise<void> => {
    const nt = await calculateNightTime();
    const ft = await calculateFlightTime();

    setFlightRecord({ ...fr, night_time: nt, total_time: ft });
  }



  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="#"></IonBackButton>
          </IonButtons>
          <IonButtons slot="secondary">
            <IonButton onClick={saveFlightRecord}>
              <IonIcon slot="icon-only" icon={checkmark}></IonIcon>
            </IonButton>
            {(fr.uuid !== NEW_FLIGHTRECORD) &&
              <>
                <IonButton id="confirm-delete">
                  <IonIcon slot="icon-only" icon={close}></IonIcon>
                </IonButton>
                <IonAlert header="Delete flight record?" trigger="confirm-delete"
                  message="Are you sure you want to delete this flight record?"
                  buttons={[
                    { text: 'Confirm', role: 'confirm', handler: deleteFlightRecord },
                    { text: 'Cancel', role: 'cancel' },
                  ]}></IonAlert>
              </>
            }
          </IonButtons>
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Date" labelPlacement="stacked" placeholder="DD/MM/YYYY" value={fr.date}
                  onIonInput={(e: any) => { setFlightRecord({ ...fr, date: e.target.value }) }}
                  onIonChange={calculateTimes}>
                </IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Pilot in Command" labelPlacement="stacked" placeholder="Pilot in Command" value={fr.pic_name}
                  onDoubleClick={(e: any) => { setFlightRecord({ ...fr, pic_name: 'Self' }) }}
                  onIonInput={(e: any) => { setFlightRecord({ ...fr, pic_name: e.target.value }) }}>
                </IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Departure Place" labelPlacement="stacked" placeholder="Departure Place" value={fr.departure_place}
                  autocapitalize='characters'
                  onIonInput={(e: any) => { setFlightRecord({ ...fr, departure_place: e.target.value }) }}
                  onIonChange={calculateTimes}>
                </IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Departure Time" labelPlacement="stacked" placeholder="HHMM" value={fr.departure_time}
                  maxlength={4}
                  onIonInput={(e: any) => { setFlightRecord({ ...fr, departure_time: e.target.value }) }}
                  onIonChange={calculateTimes}>
                </IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Arrival Place" labelPlacement="stacked" placeholder="Arrival Place" value={fr.arrival_place}
                  autocapitalize='characters'
                  onIonInput={(e: any) => { setFlightRecord({ ...fr, arrival_place: e.target.value }) }}
                  onIonChange={calculateTimes}>
                </IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Arrival Time" labelPlacement="stacked" placeholder="HHMM" value={fr.arrival_time}
                  maxlength={4}
                  onIonInput={(e: any) => { setFlightRecord({ ...fr, arrival_time: e.target.value }) }}
                  onIonChange={calculateTimes}>
                </IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Aircraft Model" labelPlacement="stacked" placeholder="Aircraft Model"
                  value={fr.aircraft_model} onIonInput={(e: any) => { setFlightRecord({ ...fr, aircraft_model: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Aircraft Registration" labelPlacement="stacked" placeholder="Aircraft Registration"
                  value={fr.reg_name} onIonInput={(e: any) => { setFlightRecord({ ...fr, reg_name: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Total Time" labelPlacement="stacked" placeholder="HH:MM"
                  value={fr.total_time} onIonInput={(e: any) => { setFlightRecord({ ...fr, total_time: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Day" labelPlacement="stacked" placeholder="Day"
                  value={fr.day_landings} onIonInput={(e: any) => { setFlightRecord({ ...fr, day_landings: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Night" labelPlacement="stacked" placeholder="Night"
                  value={fr.night_landings} onIonInput={(e: any) => { setFlightRecord({ ...fr, night_landings: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="SE" labelPlacement="stacked" placeholder="HH:MM"
                  onDoubleClick={(e: any) => { setFlightRecord({ ...fr, se_time: fr.total_time }) }}
                  value={fr.se_time} onIonInput={(e: any) => { setFlightRecord({ ...fr, se_time: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="ME" labelPlacement="stacked" placeholder="HH:MM"
                  onDoubleClick={(e: any) => { setFlightRecord({ ...fr, me_time: fr.total_time }) }}
                  value={fr.me_time} onIonInput={(e: any) => { setFlightRecord({ ...fr, me_time: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="MCC" labelPlacement="stacked" placeholder="HH:MM"
                  onDoubleClick={(e: any) => { setFlightRecord({ ...fr, mcc_time: fr.total_time }) }}
                  value={fr.mcc_time} onIonInput={(e: any) => { setFlightRecord({ ...fr, mcc_time: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Night" labelPlacement="stacked" placeholder="HH:MM"
                  onDoubleClick={(e: any) => { setFlightRecord({ ...fr, night_time: fr.total_time }) }}
                  value={fr.night_time} onIonInput={(e: any) => { setFlightRecord({ ...fr, night_time: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="IFR" labelPlacement="stacked" placeholder="HH:MM"
                  onDoubleClick={(e: any) => { setFlightRecord({ ...fr, ifr_time: fr.total_time }) }}
                  value={fr.ifr_time} onIonInput={(e: any) => { setFlightRecord({ ...fr, ifr_time: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="PIC" labelPlacement="stacked" placeholder="HH:MM"
                  onDoubleClick={(e: any) => { setFlightRecord({ ...fr, pic_time: fr.total_time }) }}
                  value={fr.pic_time} onIonInput={(e: any) => { setFlightRecord({ ...fr, pic_time: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Co Pilot" labelPlacement="stacked" placeholder="HH:MM"
                  onDoubleClick={(e: any) => { setFlightRecord({ ...fr, co_pilot_time: fr.total_time }) }}
                  value={fr.co_pilot_time} onIonInput={(e: any) => { setFlightRecord({ ...fr, co_pilot_time: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Dual" labelPlacement="stacked" placeholder="HH:MM"
                  onDoubleClick={(e: any) => { setFlightRecord({ ...fr, dual_time: fr.total_time }) }}
                  value={fr.dual_time} onIonInput={(e: any) => { setFlightRecord({ ...fr, dual_time: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Instr" labelPlacement="stacked" placeholder="HH:MM"
                  onDoubleClick={(e: any) => { setFlightRecord({ ...fr, instructor_time: fr.total_time }) }}
                  value={fr.instructor_time} onIonInput={(e: any) => { setFlightRecord({ ...fr, instructor_time: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Sim Type" labelPlacement="stacked" placeholder="Simulator Type"
                  value={fr.sim_type} onIonInput={(e: any) => { setFlightRecord({ ...fr, sim_type: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonInput label="Sim Time" labelPlacement="stacked" placeholder="HH:MM"
                  onDoubleClick={(e: any) => { setFlightRecord({ ...fr, sim_time: fr.total_time }) }}
                  value={fr.sim_time} onIonInput={(e: any) => { setFlightRecord({ ...fr, sim_time: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonInput label="Remarks" labelPlacement="stacked" placeholder="Remarks"
                  value={fr.remarks} onIonInput={(e: any) => { setFlightRecord({ ...fr, remarks: e.target.value }) }}></IonInput>
              </IonItem>
            </IonCol>

          </IonRow>
        </IonGrid>

      </IonContent>
    </IonPage >
  );
};

export default Flight;
