
import { SQLiteDBConnection } from "react-sqlite-hook";
import { sqlite } from "../../../App";
import { Convert, DeletedItem, FlightRecord } from "../../interfaces/Interfaces";
import { DB_STRUCTURE } from "./Structure";
import { getTimestamp } from "../helpers/Helpers";

const DBNAME = 'weblogbook.db';
const DBVERSION = 1;

export class DBModel {
    db: any;

    constructor() { }

    /**
     * Inits database connection and opens db
     */
    async initDBConnection(): Promise<void> {
        const ret = await sqlite.checkConnectionsConsistency();
        const isConn = (await sqlite.isConnection(DBNAME, false)).result;

        if (isConn) {
            this.db = await sqlite.retrieveConnection(DBNAME, false);
        } else {
            this.db = await sqlite.createConnection(DBNAME, false, "no-encryption", 1, false);
        }

        const isDBOpen = await this.db.isDBOpen();
        if (!isDBOpen.result) {
            await this.db.open();
        }

        const version = await this.db.getVersion();
        if (version !== DBVERSION) {
            await this.db.execute(DB_STRUCTURE);
        }
    }

    /**
     * The main purpose is to run queries to create tables and views in an empty db
     */
    async initDB(): Promise<void> {
        await this.initDBConnection();
        await this.db.execute(DB_STRUCTURE);
    }

    ////////////////////////////////////////////////////////////////////////////
    // Flight records functions
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Returns a number of flight records in the database.
     * @returns A promise that resolves with the number of flight records in the database.
     */
    async getFlightRecordsCount(): Promise<number> {
        const res = await this.db.query('SELECT COUNT(uuid) AS count FROM logbook_view');
        return res.values![0].count;
    }

    /**
     * Returns a number of flight records in the database.
     * @returns A promise that resolves with the number of flight records in the database.
     */
    async getFlightRecords(): Promise<FlightRecord[] | Error> {

        let frs: FlightRecord[] = [];

        try {
            const query = 'SELECT * FROM logbook_view ORDER BY m_date DESC, departure_time DESC';
            const res = await this.db.query(query);

            for (let i = 0; i < res.values!.length; i++) {
                const fr = Convert.toFlightRecord(JSON.stringify(res.values![i]));
                frs.push(fr);
            }

            return frs;
        } catch (err: any) {
            return err as Error;
        }
    }

    /**
     * Returns a number of flight records in the database for the syncrronization with a main app.
     * @returns A promise that resolves with the number of flight records in the database.
     */
    async getFlightRecordsForSync(): Promise<any | Error> {

        let frs = [];

        try {
            const query = 'SELECT * FROM logbook_view ORDER BY m_date DESC, departure_time DESC';
            const res = await this.db.query(query);

            for (let i = 0; i < res.values!.length; i++) {
                const fr = Convert.toFlightRecord(JSON.stringify(res.values![i]));
                const converted = Convert.toFlightRecordForSync(fr);
                frs.push(converted);
            }

            return frs;
        } catch (err: any) {
            return err as Error;
        }
    }


    /**
     * Inserts a flight record into the database.
     * @param fr - The flight record to be inserted.
     * @returns A promise that resolves with void if the insertion is successful, or an Error if there is an error.
     */
    async insertFlightRecord(fr: FlightRecord): Promise<void | Error> {
        if (fr.update_time === 0) {
            fr.update_time = getTimestamp();
        }

        const query = `INSERT INTO logbook 
		    (uuid, date, departure_place, departure_time,
		    arrival_place, arrival_time, aircraft_model, reg_name,
		    se_time, me_time, mcc_time, total_time, day_landings, night_landings,
		    night_time, ifr_time, pic_time, co_pilot_time, dual_time, instructor_time,
		    sim_type, sim_time, pic_name, remarks, update_time)
		    VALUES (?, ?, ?, ?,
            ?, ?, ?, ?,
		    ?, ?, ?, ?, ?, ?,
		    ?, ?, ?, ?, ?, ?,
		    ?, ?, ?, ?, ?)`;
        try {
            const res = await this.db.query(query, [fr.uuid, fr.date, fr.departure_place, fr.departure_time,
            fr.arrival_place, fr.arrival_time, fr.aircraft_model, fr.reg_name,
            fr.se_time, fr.me_time, fr.mcc_time, fr.total_time, fr.day_landings, fr.night_landings,
            fr.night_time, fr.ifr_time, fr.pic_time, fr.co_pilot_time, fr.dual_time, fr.instructor_time,
            fr.sim_type, fr.sim_time, fr.pic_name, fr.remarks, fr.update_time]);

            return
        } catch (err: any) {
            return err as Error;
        }
    }

    /**
     * Updates a flight record in the database.
     * @param fr - The flight record to be updated.
     * @returns A promise that resolves with void if the update is successful, or an Error if there is an error.
     */
    async updateFlightRecord(fr: FlightRecord): Promise<void | Error> {
        if (fr.update_time === 0) {
            fr.update_time = getTimestamp();
        }

        const query = `UPDATE logbook SET
		    date = ?, departure_place = ?, departure_time = ?,
		    arrival_place = ?, arrival_time = ?, aircraft_model = ?, reg_name = ?,
		    se_time = ?, me_time = ?, mcc_time = ?, total_time = ?, day_landings = ?, night_landings = ?,
		    night_time = ?, ifr_time = ?, pic_time = ?, co_pilot_time = ?, dual_time = ?, instructor_time = ?,
		    sim_type = ?, sim_time = ?, pic_name = ?, remarks = ?, update_time = ?
		    WHERE uuid = ?`;
        try {
            await this.db.query(query, [fr.date, fr.departure_place, fr.departure_time,
            fr.arrival_place, fr.arrival_time, fr.aircraft_model, fr.reg_name,
            fr.se_time, fr.me_time, fr.mcc_time, fr.total_time, fr.day_landings, fr.night_landings,
            fr.night_time, fr.ifr_time, fr.pic_time, fr.co_pilot_time, fr.dual_time, fr.instructor_time,
            fr.sim_type, fr.sim_time, fr.pic_name, fr.remarks, fr.update_time, fr.uuid]);

            return;
        } catch (err: any) {
            return err as Error;
        }

    }

    /**
     * Deletes a flight record from the database.
     * @param uuid - The uuid of the flight record to be deleted.
     * @param isSync - Whether or not to synchronize the deletion with the main app.
     * @returns A promise that resolves with void if the deletion is successful, or an Error if there is an error.
     */
    async deleteFlightRecord(uuid: string, isSync = true): Promise<void | Error> {
        try {
            await this.db.query('DELETE FROM logbook WHERE uuid = ?', [uuid]);

            if (isSync) {
                const query = `INSERT INTO deleted_items (uuid, table_name, delete_time) VALUES (?, ?, ?)`;
                await this.db.query(query, [uuid, 'logbook', (getTimestamp).toString()]);
            }
            return;
        } catch (err: any) {
            return err as Error;
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // Sync functions
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Synchronizes a flight record from the main application
     * @param fr - flight record to sync
     * @returns amount of updated/inserted records (0 or 1), or error if occurs
     */
    async syncFlightRecords(fr: FlightRecord): Promise<number | Error> {
        const res = await this.db.query('SELECT * FROM logbook_view WHERE uuid = ?', [fr.uuid]);
        if (res.values!.length === 0) {
            // no such uuid in the db, add new flight record
            const insert = await this.insertFlightRecord(fr);
            if (insert instanceof Error) {
                return insert;
            } else {
                return 1;
            }
        } else {
            // local flight record exists, let's compare update_time
            const lfr = Convert.toFlightRecord(JSON.stringify(res.values![0]));
            if (res.values![0].update_time < fr.update_time) {
                console.log(lfr.update_time, fr.update_time);
                const res = await this.updateFlightRecord(fr);
                if (res instanceof Error) {
                    return res;
                } else {
                    return 1;
                }
            } else {
                return 0;
            }
        }

    }

    /**
     * Synchronizes deleted items from the main application
     * @param di - deleted item to sync
     * @returns void or error if occurs
     */
    async syncDeletedItems(di: DeletedItem): Promise<void | Error> {
        if (di.table_name === 'logbook') {
            await this.deleteFlightRecord(di.uuid, false);
        }
        return;
    }


    /**
     * Retrieves the deleted items from the database.
     * @returns A promise that resolves to an array of DeletedItem objects.
     */
    async getDeletedItems(): Promise<DeletedItem[]> {
        let dis: DeletedItem[] = [];

        const res = await this.db.query('SELECT uuid, table_name, delete_time FROM deleted_items');

        if (res.values!.length !== 0) {
            for (let i = 0; i < res.values!.length; i++) {
                const di = Convert.toDeletedItem(JSON.stringify(res.values![i]));
                dis.push(di);
            }
        }

        return dis;
    }

    /**
     * Cleans up deleted items from the database.
     * @returns A promise that resolves when the cleanup is complete.
     */
    async cleanDeletedItems(): Promise<void> {
        await this.db.query('DELETE FROM deleted_items');
        return;
    }

};

