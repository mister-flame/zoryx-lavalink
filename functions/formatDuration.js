/*
    * Function to format a duration in milliseconds into a more human-readable format (HH:MM:SS or MM:SS)
    * @param {number} ms - The duration in milliseconds to format
    * @returns {Array} - An array containing the formatted duration as strings (e.g., ["01", "30"] for 1 minute and 30 seconds)
*/

module.exports.formatDuration = async function formatDuration(ms) {
    let seconds = ms / 1000;
    let hours = parseInt(seconds / 3600);
    seconds = seconds % 3600;
    let minutes = parseInt(seconds / 60);
    seconds = seconds % 60;

    if (seconds < 10) seconds = `0${parseInt(seconds)}`;
    else seconds = `${parseInt(seconds)}`;

    if (minutes < 10) minutes = `0${minutes}`;
    else minutes = `${minutes}`;

    if (hours < 10) hours = `0${hours}`;
    else hours = `${hours}`;

    if (hours == 0) return [minutes, seconds];

    return [hours, minutes, seconds]
};