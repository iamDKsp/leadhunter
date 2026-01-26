import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
    console.error("❌ API Key missing in .env");
    process.exit(1);
}

console.log("🔑 Testing with API Key:", GOOGLE_MAPS_API_KEY);

const testSearch = async () => {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
        const params = {
            query: 'Barbearia em São Paulo',
            key: GOOGLE_MAPS_API_KEY
        };
        console.log("🌐 Requesting:", url);

        const response = await axios.get(url, { params });

        console.log("✅ Status Code:", response.status);
        console.log("📦 Response Status:", response.data.status);

        if (response.data.results && response.data.results.length > 0) {
            console.log(`🎉 Found ${response.data.results.length} results!`);
            console.log("First result:", response.data.results[0].name);
        } else {
            console.log("⚠️ No results found or error:", response.data);
        }
    } catch (error: any) {
        console.error("❌ Error:", error.message);
        if (error.response) {
            console.error("Response Data:", error.response.data);
        }
    }
};

testSearch();
