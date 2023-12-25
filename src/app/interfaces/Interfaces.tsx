export const NEW_RECORD = "NEW_RECORD"

/**
 * Represents an application settings
 */
export interface AppSettings {
    url: string;
    user: string;
    pwd: string;
    auth: boolean;
}

/**
 * Represents a flight record
 */
export interface FlightRecord {
    uuid: string;
    aircraft_model: string;
    arrival_place: string;
    arrival_time: string;
    co_pilot_time: string;
    date: string;
    day_landings: number;
    departure_place: string;
    departure_time: string;
    dual_time: string;
    ifr_time: string;
    instructor_time: string;
    mcc_time: string;
    me_time: string;
    night_landings: number;
    night_time: string;
    pic_name: string;
    pic_time: string;
    reg_name: string;
    remarks: string;
    se_time: string;
    sim_time: string;
    sim_type: string;
    total_time: string;
    update_time: number;
    m_date?: string;
}


/**
 * Creates an empty FlightRecord object.
 * @returns {FlightRecord} The empty FlightRecord object.
 */
export function emptyFlightRecord(): FlightRecord {
    let fr: FlightRecord = {
        uuid: '',
        aircraft_model: '',
        arrival_place: '',
        arrival_time: '',
        co_pilot_time: '',
        date: '',
        day_landings: 0,
        departure_place: '',
        departure_time: '',
        dual_time: '',
        ifr_time: '',
        instructor_time: '',
        mcc_time: '',
        me_time: '',
        night_landings: 0,
        night_time: '',
        pic_name: '',
        pic_time: '',
        reg_name: '',
        remarks: '',
        se_time: '',
        sim_time: '',
        sim_type: '',
        total_time: '',
        update_time: 0,
        m_date: '',
    };

    return fr;
}

/**
 * Represents a deleted item
 */
export interface DeletedItem {
    uuid: string;
    table_name?: string;
    delete_time?: string;
}

/**
 * Represents an airport
 */
export interface Airport {
    icao: string;
    iata: string;
    name: string;
    city: string;
    country: string;
    elevation: number;
    lat: number;
    lon: number;
}

/**
 * Represents an attachment
 */
export interface Attachment {
    uuid: string;
    document: string;
    document_name: string;
    record_id: string;
}

/**
 * Represents a license
 */
export interface License {
    category: string;
    document: string;
    document_name: string;
    issued: string;
    name: string;
    number: string;
    remarks: string;
    update_time: number;
    uuid: string;
    valid_from: string;
    valid_until: string;
}

export function emptyLicense(): License {
    let l: License = {
        category: '',
        document: '',
        document_name: '',
        issued: '',
        name: '',
        number: '',
        remarks: '',
        update_time: 0,
        uuid: '',
        valid_from: '',
        valid_until: '',
    };

    return l;
}

// https://app.quicktype.io/
export class Convert {
    public static toFlightRecord(json: string): FlightRecord {
        return cast(JSON.parse(json), r("FlightRecord"));
    }

    public static flightRecordToJson(value: FlightRecord): string {
        return JSON.stringify(uncast(value, r("FlightRecord")), null, 2);
    }

    public static toFlightRecordForSync(value: FlightRecord): any {
        const converted = {
            "uuid": value.uuid,
            "date": value.date,
            "departure": {
                "place": value.departure_place,
                "time": value.departure_time
            },
            "arrival": {
                "place": value.arrival_place,
                "time": value.arrival_time
            },
            "aircraft": {
                "model": value.aircraft_model,
                "reg_name": value.reg_name
            },
            "time": {
                "se_time": value.se_time,
                "me_time": value.me_time,
                "mcc_time": value.mcc_time,
                "total_time": value.total_time,
                "night_time": value.night_time,
                "ifr_time": value.ifr_time,
                "pic_time": value.pic_time,
                "co_pilot_time": value.co_pilot_time,
                "dual_time": value.dual_time,
                "instructor_time": value.instructor_time,
            },
            "landings": {
                "day": value.day_landings,
                "night": value.night_landings
            },
            "sim": {
                "type": value.sim_type,
                "time": value.sim_time
            },
            "pic_name": value.pic_name,
            "remarks": value.remarks,
            "update_time": value.update_time,
        }

        return converted;
    }

    public static toDeletedItem(json: string): DeletedItem {
        return cast(JSON.parse(json), r("DeletedItem"));
    }

    public static deletedItemToJson(value: DeletedItem): string {
        return JSON.stringify(uncast(value, r("DeletedItem")), null, 2);
    }

    public static toAirport(json: string): Airport {
        return cast(JSON.parse(json), r("Airport"));
    }

    public static airportToJson(value: Airport): string {
        return JSON.stringify(uncast(value, r("Airport")), null, 2);
    }

    public static toAttachment(json: string): Attachment {
        return cast(JSON.parse(json), r("Attachment"));
    }

    public static attachmentToJson(value: Attachment): string {
        return JSON.stringify(uncast(value, r("Attachment")), null, 2);
    }

    public static toLicense(json: string): License {
        const pjson = JSON.parse(json);
        if (pjson.document === null) { pjson.document = ''; }
        return cast(pjson, r("License"));
    }

    public static licenseToJson(value: License): string {
        return JSON.stringify(uncast(value, r("License")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) { }
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems") ? transformArray(typ.arrayItems, val)
                : typ.hasOwnProperty("props") ? transformObject(getProps(typ), typ.additional, val)
                    : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "FlightRecord": o([
        { json: "aircraft_model", js: "aircraft_model", typ: "" },
        { json: "arrival_place", js: "arrival_place", typ: "" },
        { json: "arrival_time", js: "arrival_time", typ: "" },
        { json: "co_pilot_time", js: "co_pilot_time", typ: "" },
        { json: "date", js: "date", typ: "" },
        { json: "day_landings", js: "day_landings", typ: 0 },
        { json: "departure_place", js: "departure_place", typ: "" },
        { json: "departure_time", js: "departure_time", typ: "" },
        { json: "dual_time", js: "dual_time", typ: "" },
        { json: "ifr_time", js: "ifr_time", typ: "" },
        { json: "instructor_time", js: "instructor_time", typ: "" },
        { json: "mcc_time", js: "mcc_time", typ: "" },
        { json: "me_time", js: "me_time", typ: "" },
        { json: "night_landings", js: "night_landings", typ: 0 },
        { json: "night_time", js: "night_time", typ: "" },
        { json: "pic_name", js: "pic_name", typ: "" },
        { json: "pic_time", js: "pic_time", typ: "" },
        { json: "reg_name", js: "reg_name", typ: "" },
        { json: "remarks", js: "remarks", typ: "" },
        { json: "se_time", js: "se_time", typ: "" },
        { json: "sim_time", js: "sim_time", typ: "" },
        { json: "sim_type", js: "sim_type", typ: "" },
        { json: "total_time", js: "total_time", typ: "" },
        { json: "update_time", js: "update_time", typ: 0 },
        { json: "uuid", js: "uuid", typ: "" },
        { json: "m_date", js: "m_date", typ: u(undefined, "") },
    ], false),
    "DeletedItem": o([
        { json: "delete_time", js: "delete_time", typ: "" },
        { json: "table_name", js: "table_name", typ: "" },
        { json: "uuid", js: "uuid", typ: "" },
    ], false),
    "Airport": o([
        { json: "city", js: "city", typ: "" },
        { json: "country", js: "country", typ: "" },
        { json: "elevation", js: "elevation", typ: 0 },
        { json: "iata", js: "iata", typ: "" },
        { json: "icao", js: "icao", typ: "" },
        { json: "lat", js: "lat", typ: 3.14 },
        { json: "lon", js: "lon", typ: 3.14 },
        { json: "name", js: "name", typ: "" },
    ], false),
    "Attachment": o([
        { json: "document", js: "document", typ: "" },
        { json: "document_name", js: "document_name", typ: "" },
        { json: "record_id", js: "record_id", typ: "" },
        { json: "uuid", js: "uuid", typ: "" },
    ], false),
    "License": o([
        { json: "category", js: "category", typ: "" },
        { json: "document", js: "document", typ: "" },
        { json: "document_name", js: "document_name", typ: "" },
        { json: "issued", js: "issued", typ: "" },
        { json: "name", js: "name", typ: "" },
        { json: "number", js: "number", typ: "" },
        { json: "remarks", js: "remarks", typ: "" },
        { json: "update_time", js: "update_time", typ: 0 },
        { json: "uuid", js: "uuid", typ: "" },
        { json: "valid_from", js: "valid_from", typ: "" },
        { json: "valid_until", js: "valid_until", typ: "" },
    ], false),
};