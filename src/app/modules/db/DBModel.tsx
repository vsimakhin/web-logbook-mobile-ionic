
import { SQLiteDBConnection } from "react-sqlite-hook";
import { sqlite } from "../../../App";
import { Convert, DeletedItem, FlightRecord } from "../../interfaces/Interfaces";
import { DB_STRUCTURE } from "./Structure";

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
     * @returns number of the flight records in the database
     */
    async getFlightRecordsCount(): Promise<number> {
        const res = await this.db.query('SELECT COUNT(uuid) AS count FROM logbook_view');
        return res.values![0].count;
    }

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

    async insertFlightRecord(fr: FlightRecord): Promise<void | Error> {
        if (fr.update_time === 0) {
            fr.update_time = Date.now() / 1000;
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

    async updateFlightRecords(fr: FlightRecord): Promise<void | Error> {
        if (fr.update_time === 0) {
            fr.update_time = Date.now() / 1000;
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

    async deleteFlightRecord(uuid: string, isSync = true): Promise<void | Error> {
        try {
            await this.db.query('DELETE FROM logbook WHERE uuid = ?', [uuid]);

            if (isSync) {
                const query = `INSERT INTO deleted_items (uuid, table_name, delete_time) VALUES (?, ?, ?)`;
                await this.db.query(query, [uuid, 'logbook', (Date.now() / 1000).toString()]);
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
        const res = await this.db.query('SELECT uuid, update_time FROM logbook_view WHERE uuid = ?', [fr.uuid]);
        if (res.values!.length === 0) {
            // add new flight record
            const res = await this.insertFlightRecord(fr);
            if (res instanceof Error) {
                return res;
            } else {
                return 1;
            }
        } else {
            // update flight record
            if (res.values![0].update_time < fr.update_time) {
                const res = await this.updateFlightRecords(fr);
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

    async syncDeletedItems(di: DeletedItem): Promise<void | Error> {
        if (di.table_name === 'logbook') {
            this.deleteFlightRecord(di.uuid, false);
        }
        return;
    }

    async getDeletedItems(): Promise<DeletedItem[]> {
        let dis: DeletedItem[] = [];

        const res = await this.db.query('SELECT uuid, table_name, delete_time FROM deleted_items');
        if (res.values!.length !== 0) {
            for (let i = 0; i < res.values!.length; i++) {
                const di = Convert.toDeletedItem(JSON.stringify(res.values![0]));
                dis.push(di);
            }
        }

        return dis;
    }

};

