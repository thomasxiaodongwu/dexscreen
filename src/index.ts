import axios from 'axios';
import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'dexscreener';
const COLLECTION_NAME = 'tokens';

async function fetchData() {
    try {
        const response = await axios.get('https://api.dexscreener.com/token-profiles/latest/v1');
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

async function storeData(data: any[]) {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        const currentDate = new Date();
        for (const item of data) {
            const existing = await collection.findOne({ tokenAddress: item.tokenAddress });
            if (!existing && item.chainId === "solana" ) {
                item.runstatus = 0;
                item.createdAt = currentDate;
                item.updatedAt = currentDate;
                await collection.insertOne(item);
                console.log(`Inserted: ${item.tokenAddress}`);
            } else {
                console.log(`Skipped: ${item.tokenAddress}`);
            }
        }
    } catch (error) {
        console.error('Error storing data:', error);
    } finally {
        await client.close();
    }
}

async function main() {
    setInterval(async () => {
        console.log('Fetching data...');
        const data = await fetchData();
        if (data) {
            await storeData(data);
        }
    }, 2000);
}

main().catch(console.error);