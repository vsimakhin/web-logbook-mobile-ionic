import { sqlite } from "../../../App";
import { Airport, Attachment, Convert, DeletedItem, FlightRecord } from "../../interfaces/Interfaces";
import { DB_STRUCTURE } from "./Structure";
import { getTimestamp } from "../helpers/Helpers";
import { Toast } from "@capacitor/toast";

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
    // Airports functions
    ////////////////////////////////////////////////////////////////////////////
    /**
     * Returns a number of airports in the database.
     * @returns A promise that resolves with the number of airports in the database.
     */
    async getAirportsCount(): Promise<number> {
        const res = await this.db.query('SELECT COUNT(icao) AS count FROM airports');
        return res.values![0].count;
    }

    async getAirport(id: string): Promise<Airport | Error> {
        const res = await this.db.query('SELECT * FROM airports WHERE icao = ? OR iata = ?', [id, id]);
        if (res.values!.length === 0) {
            return new Error('No such airport');
        } else {
            return Convert.toAirport(JSON.stringify(res.values![0]));
        }
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
            // delete flight record
            await this.db.query('DELETE FROM logbook WHERE uuid = ?', [uuid]);

            // add deleted item to the deleted_items table
            if (isSync) {
                const query = `INSERT INTO deleted_items (uuid, table_name, delete_time) VALUES (?, ?, ?)`;
                await this.db.query(query, [uuid, 'logbook', (getTimestamp).toString()]);
            }

            // delete attachments
            await this.db.query('DELETE FROM attachments WHERE record_id = ?', [uuid]);

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
    async syncFlightRecords(fr: FlightRecord): Promise<void | Error> {
        const res = await this.db.query('SELECT * FROM logbook_view WHERE uuid = ?', [fr.uuid]);
        if (res.values!.length === 0) {
            // no such uuid in the db, add new flight record
            const insert = await this.insertFlightRecord(fr);
            if (insert instanceof Error) {
                return insert;
            }
        } else {
            // local flight record exists, let's compare update_time
            const lfr = Convert.toFlightRecord(JSON.stringify(res.values![0]));
            if (res.values![0].update_time < fr.update_time) {
                const res = await this.updateFlightRecord(fr);
                if (res instanceof Error) {
                    return res;
                }
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


    /**
     * Updates the airports database with the provided airport data.
     * 
     * @param airports - An array of Airport objects containing the airport data to be updated.
     * @returns A Promise that resolves with void if the update is successful, or an Error if an error occurs.
     */
    async updateAirportsDB(airports: Airport[]): Promise<void | Error> {
        // drop indexes, truncate table, create indexes sql queries
        const dropIndexes = `
            DROP INDEX IF EXISTS airports_icao;
            DROP INDEX IF EXISTS airports_iata;
        `;
        const truncateTable = 'DELETE FROM airports;';
        const createIndexes = `
            CREATE UNIQUE INDEX IF NOT EXISTS airports_icao ON airports(icao);
            CREATE INDEX IF NOT EXISTS airports_iata ON airports(iata);
        `;
        const query = `INSERT INTO airports (icao, iata, name, city, country, elevation, lat, lon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        try {
            // drop indexes and remove all data from airports table
            await this.db.query(dropIndexes);
            await this.db.query(truncateTable);


            // insert new airport data
            for (let i = 0; i < airports.length; i++) {
                await this.db.query(query, [
                    airports[i].icao, airports[i].iata, airports[i].name,
                    airports[i].city, airports[i].country, airports[i].elevation,
                    airports[i].lat, airports[i].lon
                ]);

                // show toast with info every 1500 records
                if (i % 1500 === 0 && i !== 0) {
                    await Toast.show({ text: `${i} of ${airports.length} records updated` });
                }
            }

            // create indexes
            await this.db.query(createIndexes);

        } catch (err: any) {
            return err as Error;
        }

        return;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Attachments functions
    ////////////////////////////////////////////////////////////////////////////


    /**
     * Inserts an attachment into the database.
     * @param att - The attachment to be inserted.
     * @returns A promise that resolves with void if the insertion is successful, or an Error object if an error occurs.
     */
    async insertAttachment(att: Attachment): Promise<void | Error> {
        const query = `INSERT INTO attachments (uuid, record_id, document_name, document)
            VALUES (?, ?, ?, ?)`;
        try {
            const res = await this.db.query(query, [att.uuid, att.record_id, att.document_name, att.document]);
            return;
        } catch (err: any) {
            return err as Error;
        }
    }


    /**
     * Retrieves a list of attachments for a given record ID.
     * @param record_id - The ID of the record.
     * @returns A promise that resolves to an array of Attachment objects or an Error object.
     */
    async getAttachmentsList(record_id: string): Promise<Attachment[] | Error> {
        let attachments: Attachment[] = [];

        try {
            const query = 'SELECT uuid, record_id, document_name, "" AS document FROM attachments WHERE record_id = ?';
            const res = await this.db.query(query, [record_id]);

            for (let i = 0; i < res.values!.length; i++) {
                const att = Convert.toAttachment(JSON.stringify(res.values![i]));
                attachments.push(att);
            }

            return attachments;
        } catch (err: any) {
            return err as Error;
        }
    }


    /**
     * Retrieves a list of all attachments from the database.
     * @returns A promise that resolves to an array of Attachment objects or an Error object.
     */
    async getAllAttachmentsList(): Promise<Attachment[] | Error> {
        let attachments: Attachment[] = [];

        try {
            const query = 'SELECT uuid, record_id, document_name, "" AS document FROM attachments';
            const res = await this.db.query(query);

            for (let i = 0; i < res.values!.length; i++) {
                const att = Convert.toAttachment(JSON.stringify(res.values![i]));
                attachments.push(att);
            }

            return attachments;
        } catch (err: any) {
            return err as Error;
        }
    }

    /**
     * Retrieves an attachment from the database based on its UUID.
     * @param uuid - The UUID of the attachment to retrieve.
     * @returns A Promise that resolves to the retrieved Attachment object, or an Error if the attachment does not exist.
     */
    async getAttachment(uuid: string): Promise<Attachment | Error> {
        const res = await this.db.query('SELECT uuid, record_id, document_name, document FROM attachments WHERE uuid = ?', [uuid]);
        if (res.values!.length === 0) {
            return new Error('No such attachment');
        } else {
            return Convert.toAttachment(JSON.stringify(res.values![0]));
        }
    }

    /**
     * Deletes an attachment from the database.
     * @param uuid - The UUID of the attachment to be deleted.
     * @param isSync - Whether or not to synchronize the deletion with the main app.
     * @returns A promise that resolves with void if the deletion is successful, or an Error if there is an error.
     */
    async deleteAttachment(uuid: string, isSync = true): Promise<void | Error> {
        try {
            await this.db.query('DELETE FROM attachments WHERE uuid = ?', [uuid]);

            // add deleted item to the deleted_items table
            if (isSync) {
                const query = `INSERT INTO deleted_items (uuid, table_name, delete_time) VALUES (?, ?, ?)`;
                await this.db.query(query, [uuid, 'attachments', (getTimestamp).toString()]);
            }
            return;
        } catch (err: any) {
            return err as Error;
        }
    }
};

