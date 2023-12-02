export const getTimestamp = (): number => {
    const now = Date.now();
    return Math.floor(0.001 * now);
};