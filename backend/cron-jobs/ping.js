const cron = require('node-cron');
const axios = require('axios');

cron.schedule("*/5 * * * *", async () => {
    try {
        const response = await axios.get(`${process.env.BASE_URL}/api/ping`);
        console.log(`[${new Date().toLocaleTimeString()}] Ping Successful`);
    } catch (error) {
        console.error(`[${new Date().toDateString()}] Ping Failed: ${error.message}`);
    }
})