
const http = require('http');

const TOTAL_REQUESTS = 1000;
const CONCURRENCY = 50;
const API_URL = 'http://127.0.0.1:5000/api/fighter?limit=10'; // Use IP to avoid resolution issues

let completedInfo = 0;
let successInfo = 0;
let failInfo = 0;
let startTime = Date.now();

const agent = new http.Agent({
    keepAlive: true,
    maxSockets: CONCURRENCY
});

function makeRequest() {
    return new Promise((resolve) => {
        const req = http.get(API_URL, { agent }, (res) => {
            // Consume response to free socket
            res.resume();
            if (res.statusCode >= 200 && res.statusCode < 300) {
                successInfo++;
            } else {
                failInfo++;
                if (failInfo <= 10) console.log(`Request failed with status: ${res.statusCode}`);
            }
            completedInfo++;
            resolve();
        });

        req.on('error', (e) => {
            failInfo++;
            console.error(`Request error: ${e.message}`);
            completedInfo++;
            resolve();
        });
    });
}

async function runLoadTest() {
    console.log(`Starting load test: ${TOTAL_REQUESTS} requests, ${CONCURRENCY} concurrency...`);

    const promises = [];
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        if (promises.length >= CONCURRENCY) {
            await Promise.race(promises);
        }
        const p = makeRequest().then(() => {
            const index = promises.indexOf(p);
            if (index > -1) {
                promises.splice(index, 1);
            }
        });
        promises.push(p);

        // Simple progress
        if (i % 100 === 0) {
            process.stdout.write(`\rProgress: ${i}/${TOTAL_REQUESTS}`);
        }
    }

    await Promise.all(promises);

    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n\nLoad test finished in ${duration.toFixed(2)}s`);
    console.log(`Throughput: ${(TOTAL_REQUESTS / duration).toFixed(2)} req/s`);
    console.log(`Success: ${successInfo}`);
    console.log(`Failed: ${failInfo}`);
}

runLoadTest();
