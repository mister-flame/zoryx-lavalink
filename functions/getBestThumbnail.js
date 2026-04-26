// Dependency for making HTTP requests

const p = require("phin");

/*
    Function to get the best available thumbnail for a YouTube video. It checks for different quality levels and returns the URL of the best one found.
    @param {string} videoId - The ID of the YouTube video to get the thumbnail for
    @returns {string|null} - The URL of the best available thumbnail, or null if none are found
*/

module.exports.getBestThumbnail = async function getBestThumbnail(videoId) {

    // Define the different thumbnail quality levels to check, from highest to lowest

    const qualities = [
        "maxresdefault",
        "sddefault",
        "hqdefault",
        "mqdefault",
        "default",
        "0"
    ];

    // Loop through the quality levels and check if the thumbnail exists by making a GET request to the URL

    try {

    for (const q of qualities) {
        const url = `https://img.youtube.com/vi/${videoId}/${q}.jpg`;

        const res = await p({
            url,
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36"
            }
        }).catch((err) => {
            // If it's an HTTP error response (like 404), continue to next quality
            if (err.response && err.response.status) {
                return null; // Return null for HTTP errors so loop continues
            }
            // For actual network errors, log and throw
            console.error(`Error fetching thumbnail for video ID ${videoId} at quality ${q}:`, err);
            return null;
        });

        // Return the URL of the thumbnail if the response status code is 200 (OK), indicating that the thumbnail exists

        if (res && res.statusCode === 200) {
            return url;
        }
    }

    } catch (error) {
        console.error(`Error while checking thumbnails for video ID ${videoId}:`, error);
        return null; // Return null if there's an error during the thumbnail checking process
    }

    // If none of the thumbnails are found, return null

    return null;
};
