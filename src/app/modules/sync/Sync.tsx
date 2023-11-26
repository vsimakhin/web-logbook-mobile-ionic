import { AppSettings, Convert } from '../../interfaces/Interfaces';
import { Toast } from '@capacitor/toast';
import { DBModel } from '../db/DBModel';

export class Sync {
    private settings: AppSettings;

    private SYNC_LOGIN = '/login'
    private SYNC_FLIGHT_RECORDS = '/sync/flightrecords';
    private SYNC_DELETED = '/sync/deleted';

    constructor(settings: AppSettings) {
        this.settings = settings;
    }

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

    getURL(path: string) {
        return `${this.settings.url}${path}`
    }

    public async updateFlightRecords() {
        const db = new DBModel();
        await db.initDBConnection();

        const frs = await this.get(this.getURL(this.SYNC_FLIGHT_RECORDS));
        if (frs === null) {
            return
        }

        let err: Error;
        let errorsCounter = 0;
        let recordsCounter = 0;

        await Toast.show({ text: `${frs.length} record(s) downloaded, synchronizing...` });

        for (let i = 0; i < frs.length; i++) {
            const fr = Convert.toFlightRecord(JSON.stringify(frs[i]));

            const res = await db.syncFlightRecords(fr);
            if (res instanceof Error) {
                errorsCounter += 1;
                err = res;
            } else {
                recordsCounter += res;
            }
        }

        if (errorsCounter !== 0) {
            await Toast.show({ text: `Some errors (${errorsCounter} errors) occured. The last error is ${err!.message}` });
        } else {
            await Toast.show({ text: `${recordsCounter} record(s) have been updated` });
        }
    }

    public async syncDeletedItems() {
        const db = new DBModel();
        await db.initDBConnection();

        let err: Error;
        let errorsCounter = 0;

        // get deleted items from the main app
        let dis = await this.get(this.getURL(this.SYNC_DELETED));
        if (dis !== null) {
            for (let i = 0; i < dis.length; i++) {
                const di = Convert.toDeletedItem(JSON.stringify(dis[i]));

                const res = await db.syncDeletedItems(di);
                if (res instanceof Error) {
                    errorsCounter += 1;
                    err = res;
                }
            }
        }

        // upload deleted items to the main app
        // some post request here

        dis = await db.getDeletedItems();
        if (dis.length !== 0) {
            this.post(this.getURL(this.SYNC_DELETED), dis);
        }

        if (errorsCounter !== 0) {
            await Toast.show({ text: `Some errors (${errorsCounter} errors) occured. The last error is ${err!.message}` });
        }
    }

    async get(url: string): Promise<any | Error> {
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

    async post(url: string, payload: any) {
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
            console.log(response);

            // if (response.status === 200) {
            //     return response.json();
            // } else {
            //     showError(`Cannot load data - ${response.statusText}`);
            // }
        }
        catch (error) {
            // showError(error);
            console.log(error);
        }
    }

}

// export async function post(url: string, payload: any) {
//     const options: RequestInit = {
//         method: 'POST',
//         headers: {
//             "Accept": "application/json"
//         },
//         mode: 'no-cors',
//         body: JSON.stringify(payload),
//         credentials: 'same-origin',
//         redirect: 'manual',
//     }

//     try {
//         const response = await fetch(url, options);
//         console.log(response);

//         // if (response.status === 200) {
//         //     return response.json();
//         // } else {
//         //     showError(`Cannot load data - ${response.statusText}`);
//         // }
//     }
//     catch (error) {
//         // showError(error);
//         console.log(error);
//     }
// }


