const { default: axios } = require("axios");
const {token} = require("../util/config")

/**
 * Function to set the voice's status to a certain state
 * @param {String} channelId the id of the channel to set the status
 * @param {String} status the status to set
 */

module.exports.updateVoiceStatus = async function updateVoiceStatus(channelId, status = '') {
    await axios.put(`https://discord.com/api/v10/channels/${channelId}/voice-status`, { status: status.length > 0 ? status : '' }, { headers: { Authorization: `Bot ${token}` } });
};