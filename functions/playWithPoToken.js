// Dependencies import

const { cipherPassword, lavalinkPassword } = require("../util/config");

/**
 * Get a potoken for a specific video, using the cipher, then use it for the lavalink server
 * @param {String} videoId the id for a specific video
 * @returns the expiration time/date for a video
 */

module.exports.playWithPoToken = async function playWithPoToken(videoId) {

    // Firstly we generate a PoToken for the specific videoId

    let generatedPoToken = await fetch(`http://localhost:8001/generate_potoken`, {
        method: "POST",
        headers: {
            "Content-Type": 'application/json',
            "Authorization": cipherPassword
        },
        body: JSON.stringify({
            videoId: videoId,
            client: "WEB"
        })
    });

    if (!generatedPoToken.ok) {
        throw new Error(`The creation of the potoken failed: ${generatedPoToken.status} ${await generatedPoToken.text()}`)
    }

    generatedPoToken = await generatedPoToken.json();

    // If everything went well we add the song to the lavalink server

    const updateLavalinkPoToken = await fetch('http://localhost:2333/youtube', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': lavalinkPassword
        },
        body: JSON.stringify({
            poToken: generatedPoToken.videoIdToken,
            visitorData: generatedPoToken.visitorData
        })
    });

    if (updateLavalinkPoToken.status !== 204) {
        throw new Error(`Lavalink /youtube update failed: ${updateLavalinkPoToken.status} ${await updateLavalinkPoToken.text()}`);
    }

    // We return the life time for this potoken

    return generatedPoToken.expiresAt;
}