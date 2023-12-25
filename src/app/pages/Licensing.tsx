import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, useIonViewDidEnter } from '@ionic/react';
import { useState } from 'react';
import { License, NEW_RECORD, emptyLicense } from '../interfaces/Interfaces';
import useWindowDimensions from '../modules/helpers/WindowDimensions';
import { DBModel } from '../modules/db/DBModel';
import { Toast } from '@capacitor/toast';
import { useHistory } from 'react-router';
import DataTable, { TableColumn } from 'react-data-table-component';
import { add } from 'ionicons/icons';
import { getCurrentDate } from '../modules/helpers/Helpers';


const Licensing: React.FC = () => {

    const [licenses, setLicenses] = useState([] as License[])
    const { width, height } = useWindowDimensions();

    const loadData = async () => {
        const db = new DBModel();
        await db.initDBConnection();

        const lics = await db.getLicenses();
        if (lics instanceof Error) {
            Toast.show({ text: lics.message })
        } else {
            setLicenses(lics);
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
    const onRowClicked = async (row: License, event: React.MouseEvent<Element, MouseEvent>) => {
        history.push('/license', { lic: row });
    }

    /**
     * Handles the click event on the New button.
     * Navigates to the '/flight' route with a new flight record.
     */
    const onNewClicked = async () => {
        let license = emptyLicense();
        license.uuid = NEW_RECORD;
        license.issued = getCurrentDate();
        license.valid_from = getCurrentDate();

        history.push('/license', { lic: license });
    }

    /**
     * Defines the columns for the FlightRecords table.
     */
    const columns: TableColumn<License>[] = [
        { name: 'uuid', selector: row => row.uuid, omit: true, },
        { name: 'Category', selector: row => row.category, width: '100px' },
        { name: 'Name', selector: row => row.name, compact: true, width: '150px' },
        { name: 'Number', selector: row => row.number, compact: true, width: '100px', omit: omitColumn() },
        { name: 'Issued', selector: row => row.issued, compact: true, omit: omitColumn() },
        { name: 'Valid From', selector: row => row.valid_from, compact: true, width: '40px', omit: omitColumn() },
        { name: 'Valid Until', selector: row => row.valid_until, compact: true, width: '100px' },
        { name: 'Document Name', selector: row => row.document_name, compact: true, width: '40px', omit: omitColumn() },
        { name: 'Remarks', selector: row => row.remarks, compact: true, width: '40px', omit: omitColumn() },
    ];
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Licensing & Endorsements</IonTitle>
                    <IonButtons slot="secondary">
                        <IonButton onClick={onNewClicked}>
                            <IonIcon slot="icon-only" icon={add}></IonIcon>
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <DataTable columns={columns} data={licenses} pagination responsive={true} striped={true} dense={true}
                    paginationPerPage={getRowsPerPage()} paginationComponentOptions={paginationComponentOptions}
                    onRowClicked={onRowClicked} highlightOnHover={true}
                />
            </IonContent>
        </IonPage>
    );
};

export default Licensing;