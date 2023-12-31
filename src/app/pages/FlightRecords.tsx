import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, useIonViewDidEnter } from '@ionic/react';
import { useState } from 'react';
import { DBModel } from '../modules/db/DBModel';
import { FlightRecord, NEW_RECORD, emptyFlightRecord } from '../interfaces/Interfaces';
import { Toast } from '@capacitor/toast';
import DataTable, { TableColumn } from 'react-data-table-component';
import useWindowDimensions from '../modules/helpers/WindowDimensions';
import { useHistory } from 'react-router';
import { add } from 'ionicons/icons';
import { getCurrentDate } from '../modules/helpers/Helpers';

const FlightRecords: React.FC = () => {

  const [flightRecords, setFlightRecords] = useState([] as FlightRecord[])
  const { width, height } = useWindowDimensions();

  const loadData = async () => {
    const db = new DBModel();
    await db.initDBConnection();

    const frs = await db.getFlightRecords();
    if (frs instanceof Error) {
      Toast.show({ text: frs.message })
    } else {
      setFlightRecords(frs);
    }
  }

  useIonViewDidEnter(() => {
    loadData();
  });


  /**
   * Determines whether to omit the column based on the width.
   * @returns {boolean} True if the column should be omitted, false otherwise.
   */
  const omitColumn = (): boolean => {
    return true && width < 400
  }

  /**
   * Calculates the number of rows per page based on the available height.
   * @returns The number of rows per page.
   */
  const getRowsPerPage = () => {
    const headerSize = 100;
    const footerSize = 100;

    return Math.round((height - (headerSize + footerSize)) / 32)
  }

  const paginationComponentOptions = { noRowsPerPage: true };

  const history = useHistory();

  /**
   * Handles the click event on a row in the FlightRecords table.
   * Navigates to the '/flight' route with the selected flight record.
   * @param row - The selected flight record.
   * @param event - The click event.
   */
  const onRowClicked = async (row: FlightRecord, event: React.MouseEvent<Element, MouseEvent>) => {
    history.push('/flight', { fr: row });
  }

  /**
   * Handles the click event on the New button.
   * Navigates to the '/flight' route with a new flight record.
   */
  const onNewClicked = async () => {
    let fr = emptyFlightRecord();
    fr.uuid = NEW_RECORD;
    fr.date = getCurrentDate();
    history.push('/flight', { fr: fr });
  }

  /**
   * Defines the columns for the FlightRecords table.
   */
  const columns: TableColumn<FlightRecord>[] = [
    { name: 'uuid', selector: row => row.uuid, omit: true, },
    { name: 'Date', selector: row => row.date, width: '100px' },
    { name: 'Departure', selector: row => row.departure_place, compact: true, width: '60px' },
    { name: 'Arrival', selector: row => row.arrival_place, compact: true, width: '60px' },
    { name: 'Aircraft', selector: row => row.reg_name && row.reg_name + " " + row.aircraft_model || row.sim_type, compact: true },
    { name: 'TT', selector: row => row.total_time && row.total_time || row.sim_time, compact: true, width: '40px', },
    { name: 'PIC Name', selector: row => row.pic_name, compact: true, omit: omitColumn() },
    { name: 'Day', selector: row => row.day_landings, compact: true, width: '40px', omit: omitColumn() },
    { name: 'Night', selector: row => row.night_landings, compact: true, width: '30px', omit: omitColumn() },
    { name: 'Night', selector: row => row.night_time, compact: true, width: '40px', omit: omitColumn() },
    { name: 'IFR', selector: row => row.ifr_time, compact: true, width: '40px', omit: omitColumn() },
    { name: 'PIC', selector: row => row.pic_time, compact: true, width: '40px', omit: omitColumn() },
    { name: 'COP', selector: row => row.co_pilot_time, compact: true, width: '40px', omit: omitColumn() },
    { name: 'Dual', selector: row => row.dual_time, compact: true, width: '40px', omit: omitColumn() },
  ];

  return (
    <IonPage >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Flight Records</IonTitle>
          <IonButtons slot="secondary">
            <IonButton onClick={onNewClicked}>
              <IonIcon slot="icon-only" icon={add}></IonIcon>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <DataTable columns={columns} data={flightRecords} pagination responsive={true} striped={true} dense={true}
          paginationPerPage={getRowsPerPage()} paginationComponentOptions={paginationComponentOptions}
          onRowClicked={onRowClicked} highlightOnHover={true}
        />
      </IonContent>
    </IonPage >
  );
};

export default FlightRecords;


