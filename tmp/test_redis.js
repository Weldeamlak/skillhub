import { createClient } from 'redis';

const client = createClient({ url: 'redis://127.0.0.1:6379' });

client.on('error', (err) => {
    console.log('Error event triggered:', err.code);
});

console.log('Starting connect...');
try {
    // This might hang if redis is down
    await client.connect();
    console.log('Connected!');
} catch (err) {
    console.log('Connect failed with error:', err.message);
}
console.log('Done.');
