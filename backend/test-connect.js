const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const API_URL = 'http://localhost:3000';

async function test() {
    // Generate token for Deborah
    const deborahId = '23d651b6-11c4-4b97-9b43-26f753f11e42';
    const token = jwt.sign({ userId: deborahId }, JWT_SECRET, { expiresIn: '7d' });

    console.log('Testing with token for Deborah...');

    try {
        const response = await axios.post(`${API_URL}/whatsapp/connect`,
            { type: 'personal' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Connect Response:', response.data);

        const statusResponse = await axios.get(`${API_URL}/whatsapp/status?type=personal`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Status Response:', statusResponse.data);
    } catch (error) {
        if (error.response) {
            console.log('Error Response:', error.response.status, error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

test();
