/**
    * Function to format a duration in milliseconds into a more human-readable format (HH:MM:SS or MM:SS)
    * @param {number} ms - The duration in milliseconds to format
    * @returns {number[]} - An array containing the formatted duration as strings (e.g., ["01", "30"] for 1 minute and 30 seconds)
*/

export async function formatDuration(ms: number) {
    let seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    const formattedSeconds = String(seconds).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedHours = String(hours).padStart(2, "0");

    if (hours === 0) return [formattedMinutes, formattedSeconds];

    return [formattedHours, formattedMinutes, formattedSeconds];
};