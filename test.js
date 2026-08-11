// Run with: node test.js
import fetch from 'node-fetch'; // or just use global fetch in modern node

async function runTest() {
  const response = await fetch('http://localhost:3001/api/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'twitch-eventsub-message-type': 'notification',
      'twitch-eventsub-subscription-type': 'channel.subscribe'
    },
    body: JSON.stringify({
      event: { user_name: 'TestViewer', broadcaster_user_name: 'MyChannel' }
    })
  });

  const text = await response.text();
  console.log('Server Status:', response.status);
  console.log('Server Response:', text);
}

runTest();