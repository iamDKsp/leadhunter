import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testStageSave() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'tarcisio@teltech.com',
            password: '123'
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('Logged in.');

        // 2. Get current stages
        console.log('Fetching stages...');
        const getRes = await axios.get(`${API_URL}/stages`, { headers });
        const currentStages = getRes.data;
        console.log('Current stages count:', currentStages.length);

        // 3. Add new stage
        const newStage = {
            id: `test-stage-${Date.now()}`,
            name: 'Stage Teste Script',
            color: '#ff0000',
            order: currentStages.length
        };
        const updatedStages = [...currentStages, newStage];

        // 4. Save stages
        console.log('Saving stages with new one...');
        const saveRes = await axios.post(`${API_URL}/stages`, updatedStages, { headers });
        console.log('Save response status:', saveRes.status);

        // 5. Verify persistence
        console.log('Fetching stages again to verify...');
        const verifyRes = await axios.get(`${API_URL}/stages`, { headers });
        const finalStages = verifyRes.data;

        const found = finalStages.find((s: any) => s.id === newStage.id);
        if (found) {
            console.log('✅ SUCCESS: New stage found in database!');
            console.log('Stage details:', found);
        } else {
            console.error('❌ FAILURE: New stage NOT found in database.');
            console.log('Final stages:', finalStages.map((s: any) => s.name));
        }

    } catch (error: any) {
        console.error('Error during test:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testStageSave();
