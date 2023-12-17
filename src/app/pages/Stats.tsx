import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonViewDidEnter } from '@ionic/react';
import { DBModel } from '../modules/db/DBModel';
import { Toast } from '@capacitor/toast';
import { useState } from 'react';
import { FlightRecord } from '../interfaces/Interfaces';
import DataTable, { TableColumn } from 'react-data-table-component';


interface FlightStats {
  co_pilot_time: number;
  day_landings: number;
  dual_time: number;
  ifr_time: number;
  instructor_time: number;
  mcc_time: number;
  me_time: number;
  night_landings: number;
  night_time: number;
  pic_time: number;
  se_time: number;
  sim_time: number;
  total_time: number;
}

interface Stats {
  item: string;
  this_month: string;
  this_year: string;
  total: string;
}

const Stats: React.FC = () => {

  const [stats, setStats] = useState<Stats[]>([]);


  /**
   * Formats a date into a YYYYDDMM representation.
   * @param date - The date to format.
   * @returns The formatted date string.
   */
  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  }

  /**
   * Converts a string in the format HH:MM into a number of minutes.
   * @param s - The string to convert.
   * @returns The number of minutes.
   */
  function stod(s: string): number {
    if (s === '') { return 0; }

    const parts = s.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }

  /**
   * Converts a number of minutes into a string in the format HH:MM.
   * @param n - The number of minutes.
   * @returns The formatted string.
   */
  const ntos = (n: number): string => {
    // convert to hours and minutes
    const hours = Math.floor(n / 60);
    const minutes = n % 60;

    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Returns an empty FlightStats object.
   * @returns An empty FlightStats object.
   */
  const getEmtpyTotals = (): FlightStats => {
    return {
      co_pilot_time: 0, day_landings: 0, dual_time: 0,
      ifr_time: 0, instructor_time: 0, mcc_time: 0,
      me_time: 0, night_landings: 0, night_time: 0,
      pic_time: 0, se_time: 0, sim_time: 0, total_time: 0,
    }
  }

  /**
   * Adds the values from a FlightRecord to a FlightStats object.
   * @param totals - The FlightStats object to add to.
   * @param fr - The FlightRecord to add.
   * @returns The updated FlightStats object.
   */
  const addTotals = (totals: FlightStats, fr: FlightRecord): FlightStats => {
    totals.co_pilot_time += stod(fr.co_pilot_time);
    totals.day_landings += fr.day_landings;
    totals.dual_time += stod(fr.dual_time);
    totals.ifr_time += stod(fr.ifr_time);
    totals.instructor_time += stod(fr.instructor_time);
    totals.mcc_time += stod(fr.mcc_time);
    totals.me_time += stod(fr.me_time);
    totals.night_landings += fr.night_landings;
    totals.night_time += stod(fr.night_time);
    totals.pic_time += stod(fr.pic_time);
    totals.se_time += stod(fr.se_time);
    totals.sim_time += stod(fr.sim_time);
    totals.total_time += stod(fr.total_time);

    return totals;
  }

  /**
   * Calculates the totals for the current month, year and all time.
   * @param frs - The flight records to calculate the totals for.
   */
  const calculateTotals = async (frs: FlightRecord[]) => {
    let totals: FlightStats = getEmtpyTotals();
    let totalsMonth: FlightStats = getEmtpyTotals();
    let totalsYear: FlightStats = getEmtpyTotals();

    if (frs.length === 0) {
      return;
    }

    const now = new Date();
    const beginningOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const beginningOfYear = new Date(now.getFullYear(), 0, 1);
    const fmtMonthDate = formatDate(beginningOfMonth);
    const fmtYearDate = formatDate(beginningOfYear);

    for (let i = 0; i < frs.length; i++) {
      const fr = frs[i];

      // this month
      if (fr.m_date!.localeCompare(fmtMonthDate) >= 0) {
        totalsMonth = addTotals(totalsMonth, fr);
      }
      // this year
      if (fr.m_date!.localeCompare(fmtYearDate) >= 0) {
        totalsYear = addTotals(totalsYear, fr);
      }
      // all totals
      totals = addTotals(totals, fr);
    }

    const st: Stats[] = [
      { item: 'Total', this_month: ntos(totalsMonth.total_time), this_year: ntos(totalsYear.total_time), total: ntos(totals.total_time) },
      { item: 'SE', this_month: ntos(totalsMonth.se_time), this_year: ntos(totalsYear.se_time), total: ntos(totals.se_time) },
      { item: 'ME', this_month: ntos(totalsMonth.me_time), this_year: ntos(totalsYear.me_time), total: ntos(totals.me_time) },
      { item: 'MCC', this_month: ntos(totalsMonth.mcc_time), this_year: ntos(totalsYear.mcc_time), total: ntos(totals.mcc_time) },
      { item: 'Night', this_month: ntos(totalsMonth.night_time), this_year: ntos(totalsYear.night_time), total: ntos(totals.night_time) },
      { item: 'IFR', this_month: ntos(totalsMonth.ifr_time), this_year: ntos(totalsYear.ifr_time), total: ntos(totals.ifr_time) },
      { item: 'PIC', this_month: ntos(totalsMonth.pic_time), this_year: ntos(totalsYear.pic_time), total: ntos(totals.pic_time) },
      { item: 'Co Pilot', this_month: ntos(totalsMonth.co_pilot_time), this_year: ntos(totalsYear.co_pilot_time), total: ntos(totals.co_pilot_time) },
      { item: 'Dual', this_month: ntos(totalsMonth.dual_time), this_year: ntos(totalsYear.dual_time), total: ntos(totals.dual_time) },
      { item: 'Instructor', this_month: ntos(totalsMonth.instructor_time), this_year: ntos(totalsYear.instructor_time), total: ntos(totals.instructor_time) },
      { item: 'Simulator', this_month: ntos(totalsMonth.sim_time), this_year: ntos(totalsYear.sim_time), total: ntos(totals.sim_time) },
      { item: 'Day Landings', this_month: totalsMonth.day_landings.toString(), this_year: totalsYear.day_landings.toString(), total: totals.day_landings.toString() },
      { item: 'Night Landings', this_month: totalsMonth.night_landings.toString(), this_year: totalsYear.night_landings.toString(), total: totals.night_landings.toString() },
    ];

    setStats(st);
  }

  const columns: TableColumn<Stats>[] = [
    { name: 'Statistics', selector: row => row.item, width: '40%' },
    { name: 'This Month', selector: row => row.this_month, width: '20%', compact: true, },
    { name: 'This Year', selector: row => row.this_year, width: '20%', compact: true, },
    { name: 'Total', selector: row => row.total, width: '20%', compact: true, },
  ]

  const loadData = async () => {
    const db = new DBModel();
    await db.initDBConnection();

    const frs = await db.getFlightRecords();
    if (frs instanceof Error) {
      Toast.show({ text: `Cannot load flight records - ${frs.message}` })
    } else {
      calculateTotals(frs);
    }
  }

  useIonViewDidEnter(() => {
    loadData();
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Stats</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <DataTable columns={columns} data={stats} responsive={true} striped={true} dense={true}
          highlightOnHover={true}
        />
      </IonContent>
    </IonPage>
  );
};

export default Stats;
