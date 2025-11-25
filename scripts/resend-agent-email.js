// Script to resend agent confirmation email to correct address
const https = require('https');
const http = require('http');

const data = JSON.stringify({
  agentEmail: 'andymason231@gmail.com',
  agentName: 'Andy Mason',
  country: 'GY',
  submittedAt: 'November 25, 2024'
});

// For production - change to your actual domain
const hostname = 'www.portalhomehub.com';
const port = 443;
const path = '/api/send-agent-confirmation-email';

const options = {
  hostname: hostname,
  port: port,
  path: path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Sending agent confirmation email to andymason231@gmail.com...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseBody);
    if (res.statusCode === 200) {
      console.log('✅ Email sent successfully!');
    } else {
      console.log('❌ Email failed to send');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error);
});

req.write(data);
req.end();