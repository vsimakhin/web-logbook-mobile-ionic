import { AppSettings, Convert, Airport } from '../../interfaces/Interfaces';
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

        for (let i = 0; i < frs.length; i++) {
            const fr = Convert.toFlightRecord(JSON.stringify(frs[i]));

            const res = await db.syncFlightRecords(fr);
            if (res instanceof Error) {
                return;
            }
        }

        // upload flight records to the main app
        frs = await db.getFlightRecordsForSync();
        const payload = { 'flight_records': frs };
        if (frs.length !== 0) {
            const res = await this.post(this.getURL(this.SYNC_FLIGHT_RECORDS), payload);
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
