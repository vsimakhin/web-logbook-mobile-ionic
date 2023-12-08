
/**
 * Returns the current timestamp in seconds.
 * @returns {number} The current timestamp.
 */
export const getTimestamp = (): number => {
    const now = Date.now();
    return Math.floor(0.001 * now);
};


/**
 * Parses a date string in the format "DD/MM/YYYY hhmm" into a Date object.
 * @param {string} datestr - The date string to parse.
 * @returns {Date | Error} The parsed Date object if the date string is valid, otherwise an Error object.
 */
export const parseDateString = (datestr: string): Date | Error => {
    const match = datestr.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2})(\d{2})$/);

    if (!match) {
        return new Error(`Invalid date format for ${datestr}`);
    }

    const [, day, month, year, hours, minutes] = match;
    const parsedDate = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00+0000`);

    // Check if the parsed date is valid
    if (isNaN(parsedDate.getTime())) {
        console.error("Invalid date");
        return new Error(`Invalid date format for ${datestr}`);
    }

    return parsedDate;
}


/**
 * Returns the current date in the format "DD/MM/YYYY".
 * @returns {string} The current date.
 */
export const getCurrentDate = (): string => {
    const currentDate = new Date();

    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;

    return formattedDate;
}