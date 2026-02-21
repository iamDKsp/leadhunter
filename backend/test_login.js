const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login with correct credentials...');
        const response = await axios.post('http://localhost:3000/auth/login', {
            email: 'tarcisio@teltech.com',
            password: '123'
        });
        console.log('Login successful:', response.data);
    } catch (error) {
        console.error('Login failed:', error.response ? error.response.data : error.message);
    }

    try {
        console.log('\nTesting login with WRONG credentials...');
        const response = await axios.post('http://localhost:3000/auth/login', {
            email: 'tarcisio@teltech.com',
            password: 'wrongpassword'
        });
        console.log('Login successful (UNEXPECTED):', response.data);
    } catch (error) {
        console.error('Login failed (EXPECTED):', error.response ? error.response.data : error.message);
    }
}

testLogin();
