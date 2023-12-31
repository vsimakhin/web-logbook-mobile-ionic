import { AppSettings, Convert, Airport, Attachment, FlightRecord } from '../../interfaces/Interfaces';
import { Toast } from '@capacitor/toast';
import { DBModel } from '../db/DBModel';

/**
 * Represents a synchronization utility for syncing data with the main app.
 */
export class Sync {
    private settings: AppSettings;

    private SYNC_LOGIN = '/login'
    private SYNC_FLIGHT_RECORDS = '/sync/flightrecords';
    private SYNC_DELETED = '/sync/deleted';
    private SYNC_AIRPORTS = '/sync/airports';
    private SYNC_ATTACHMENTS = '/sync/attachments';
    private SYNC_LICENSES = '/sync/licensing';

    constructor(settings: AppSettings) {
        this.settings = settings;
    }

    /**
     * Retrieves credentials from the main app.
     * @returns a response object
     */
    async getCredentials() {
        const url = this.getURL(this.SYNC_LOGIN);

        const payload = {
            'login': this.settings.user,
            'password': this.settings.pwd,
        }

        const options: RequestInit = {
            method: 'POST',
            headers: {
                "Accept": "application/json",
            },
            body: JSON.stringify(payload),
            credentials: 'include',
            redirect: 'manual',
        }

        const response = await fetch(url, options);

        return response;
    }

    /**
     * Returns a full URL for the main app.
     * @param path - path to the main app
     * @returns a full URL
     */
    getURL(path: string) {
        return `${this.settings.url}${path}`
    }

    /**
     * Synchronizes flight records with the main app.
     * Downloads flight records from the main app and uploads flight records to the main app.
     */
    async updateFlightRecords(): Promise<void> {
        const db = new DBModel();
        await db.initDBConnection();

        // download flight records from the main app
        let frs = await this.get(this.getURL(this.SYNC_FLIGHT_RECORDS));
        if (frs === null) {
            return
        }

        // convert json to FlightRecord[]
        let mainAppFlightRecords: FlightRecord[] = [];
        for (let i = 0; i < frs.length; i++) {
            const fr = Convert.toFlightRecord(JSON.stringify(frs[i]));
            mainAppFlightRecords.push(fr);
        }

        // get flight records from the local database
        const localFlightRecords = await db.getFlightRecords();
        if (localFlightRecords instanceof Error) {
            return;
        }

        // iterate through main app flight records
        for (let i = 0; i < mainAppFlightRecords.length; i++) {
            const fr = mainAppFlightRecords[i];

            // find flight record in the local database
            const index = localFlightRecords.findIndex(f => f.uuid === fr.uuid);
            if (index === -1) {
                // insert flight record into the local database
                const res = await db.insertFlightRecord(fr);
                if (res instanceof Error) {
                    return;
                }
            } else {
                // check update time
                const localFR = localFlightRecords[index];
                if (localFR.update_time < fr.update_time) {
                    // update flight record in the local database
                    const res = await db.updateFlightRecord(fr);
                    if (res instanceof Error) {
                        return;
                    }
                }
            }
        }

        // upload flight records to the main app
        frs = await db.getFlightRecordsForSync();
        const payload = { 'flight_records': frs };
        if (frs.length !== 0) {
            const res = await this.post(this.getURL(this.SYNC_FLIGHT_RECORDS), payload);
        }
    }

    async updateAttachments(): Promise<void> {
        const db = new DBModel();
        await db.initDBConnection();

        // get list of attachments from the main app
        const attachments = await this.get(this.getURL(`${this.SYNC_ATTACHMENTS}/all`));
        if (attachments === null) {
            return;
        }

        // convert json to Attachment[]
        let mainAppAtts: Attachment[] = [];
        for (let i = 0; i < attachments.length; i++) {
            const att = Convert.toAttachment(JSON.stringify(attachments[i]));
            mainAppAtts.push(att);
        }

        // get list of attachments from the local database
        const localAtts = await db.getAllAttachmentsList();
        if (localAtts instanceof Error) {
            return;
        }

        // find attachments that are not in the local app
        for (let i = 0; i < mainAppAtts.length; i++) {
            const att = mainAppAtts[i];
            const index = localAtts.findIndex(a => a.uuid === att.uuid);
            if (index === -1) {
                // download attachment from the main app
                const rawAtt = await this.get(this.getURL(`${this.SYNC_ATTACHMENTS}/${att.uuid}`));
                if (rawAtt !== null) {
                    await db.insertAttachment(Convert.toAttachment(JSON.stringify(rawAtt)));
                }
            }
        }

        // find attachments that are not in the main app
        for (let i = 0; i < localAtts.length; i++) {
            const att = localAtts[i];
            const index = mainAppAtts.findIndex(a => a.uuid === att.uuid);
            if (index === -1) {
                // upload attachment to the main app
                const uploadAtt = await db.getAttachment(att.uuid);
                await this.post(this.getURL(`${this.SYNC_ATTACHMENTS}/upload`), uploadAtt);
            }
        }
    }

    /**
     * Synchronizes deleted items with the main app.
     * Retrieves deleted items from the main app and uploads deleted items to the main app.
     */
    async syncDeletedItems(): Promise<void> {
        const db = new DBModel();
        await db.initDBConnection();

        // get deleted items from the main app
        let dis = await this.get(this.getURL(this.SYNC_DELETED));
        if (dis !== null) {
            for (let i = 0; i < dis.length; i++) {
                const di = Convert.toDeletedItem(JSON.stringify(dis[i]));

                const res = await db.syncDeletedItems(di);
                if (res instanceof Error) {
                    return;
                }
            }
        }

        // upload deleted items to the main app
        dis = await db.getDeletedItems();
        const payload = { 'deleted_items': dis };

        if (dis.length !== 0) {
            const res = await this.post(this.getURL(this.SYNC_DELETED), payload);
            if (res === null) {
                await db.cleanDeletedItems();
            }
        }
    }

    /**
     * Downloads airports database from the main app and updates airports database.
     */
    async updateAirportsDB(): Promise<void> {
        let airports: Airport[] = [];

        // get airports from the main app
        const json = await this.get(this.getURL(this.SYNC_AIRPORTS));
        if (json === null) {
            return;
        }

        // convert json to Airport[]
        for (let i = 0; i < json.length; i++) {
            const airport = Convert.toAirport(JSON.stringify(json[i]));
            airports.push(airport);
        }

        // update airports database
        const db = new DBModel();
        await db.initDBConnection();
        const res = await db.updateAirportsDB(airports);
        if (res instanceof Error) {
            await Toast.show({ text: `Error updating airports database` });
        }
    }

    async updateLicenses(): Promise<void> {
        const db = new DBModel();
        await db.initDBConnection();

        // download licenses from the main app
        let lics = await this.get(this.getURL(this.SYNC_LICENSES));
        if (lics === null) {
            return
        }

        for (let i = 0; i < lics.length; i++) {

            const lic = Convert.toLicense(JSON.stringify(lics[i]));

            const res = await db.syncLicense(lic);
            if (res instanceof Error) {
                return;
            }
        }

        // upload flight records to the main app
        lics = await db.getLicenses();
        const payload = { 'licenses': lics };
        if (lics.length !== 0) {
            const res = await this.post(this.getURL(this.SYNC_LICENSES), payload);
        }
    }

    /**
     * Performs a GET request to the specified URL and returns the response data.
     * If authentication is enabled, it will include the necessary credentials.
     * @param url - The URL to send the GET request to.
     * @returns A Promise that resolves to the response data, or null if an error occurs.
     */
    async get(url: string): Promise<any> {
        if (this.settings.auth) {
            const auth = await this.getCredentials();
            if (auth.status !== 200) {
                await Toast.show({ text: `Cannot auth - ${auth.statusText}` });
                return null;
            }
        }

        const options: RequestInit = {
            method: 'GET',
            headers: {
                "Accept": "application/json",
            },
            credentials: 'include'
        }

        try {
            const response = await fetch(url, options);
            if (response.status === 200) {
                return await response.json();
            } else {
                await Toast.show({ text: `Cannot load data - ${response.statusText}` });
                return null;
            }
        }
        catch (err: any) {
            await Toast.show({ text: err.message });
            return null;
        }
    }

    /**
     * Performs a POST request to the specified URL and returns the response data.
     * If authentication is enabled, it will include the necessary credentials.
     * @param url - The URL to send the POST request to.
     * @param payload - The payload to send with the POST request.
     * @returns A Promise that resolves to the response data, or null if an error occurs.
     */
    async post(url: string, payload: any): Promise<any> {
        if (this.settings.auth) {
            const auth = await this.getCredentials();
            if (auth.status !== 200) {
                await Toast.show({ text: `Cannot auth - ${auth.statusText}` });
                return null;
            }
        }

        const options: RequestInit = {
            method: 'POST',
            headers: {
                "Accept": "application/json"
            },
            body: JSON.stringify(payload),
            credentials: 'include',
        }

        try {
            const response = await fetch(url, options);

            if (response.status === 200) {
                return response.json();
            } else {
                Toast.show({ text: `Cannot upload data - ${response.statusText}` });
                return null;
            }
        }
        catch (err: any) {
            await Toast.show({ text: err.message });
            return null;
        }
    }

}
