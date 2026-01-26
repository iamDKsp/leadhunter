
import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testCostLogging() {
    try {
        // 1. Login
        console.log("Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@leadhunter.com',
            password: 'admin' // Assuming this user exists, if not we'll fail and I'll know
        }).catch(async (e) => {
            if (e.response?.status === 400) {
                // Try registering if login fails
                console.log("Login failed, trying to register admin...");
                return await axios.post(`${API_URL}/auth/register`, {
                    email: 'admin@leadhunter.com',
                    password: 'admin',
                    name: 'Admin'
                });
            }
            throw e;
        });

        const token = loginRes.data.token;
        console.log("Logged in/Registered. Token received.");

        // 2. Perform Search
        console.log("Performing search...");
        const searchRes = await axios.get(`${API_URL}/companies/search`, {
            params: { query: 'Pizzaria em São Paulo' },
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Search returned ${searchRes.data.length} results.`);

        // 3. Check Costs
        console.log("Checking cost stats...");
        const costRes = await axios.get(`${API_URL}/costs/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Cost Stats:", JSON.stringify(costRes.data, null, 2));

        if (costRes.data.totalCost > 0) {
            console.log("✅ Cost logging working successfully!");
        } else {
            console.error("❌ Total cost is 0, logging might have failed.");
        }

    } catch (error: any) {
        console.error("Test failed:", error.response?.data || error.message);
    }
}

testCostLogging();
