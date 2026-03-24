const fetch = require('node-fetch');
const FormData = require('form-data');

const API_KEY = "JVtFYBFEBzByiVhbduGmiyAb";

async function testAPI() {
  console.log('Testing Remove.bg API...');
  console.log('API Key:', API_KEY);

  // Test with a working image URL
  const form = new FormData();
  form.append('image_url', 'https://picsum.photos/500/500');
  form.append('size', 'auto');

  try {
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': API_KEY,
        ...form.getHeaders()
      },
      body: form
    });

    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));

    if (response.ok) {
      console.log('✅ API Key is valid! API works.');
      const length = response.headers.get('content-length');
      console.log('Response size:', length);
    } else {
      const text = await response.text();
      console.log('❌ API Error:', text);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

testAPI();
