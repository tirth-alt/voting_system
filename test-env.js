// Test ENV Variables
console.log('=== ENV VARIABLES TEST ===\n');

console.log('Booth PINs:');
console.log('BOOTH_1:', process.env.NEXT_PUBLIC_BOOTH_1_PIN || '❌ NOT SET');
console.log('BOOTH_2:', process.env.NEXT_PUBLIC_BOOTH_2_PIN || '❌ NOT SET');
console.log('BOOTH_3:', process.env.NEXT_PUBLIC_BOOTH_3_PIN || '❌ NOT SET');
console.log('BOOTH_4:', process.env.NEXT_PUBLIC_BOOTH_4_PIN || '❌ NOT SET');

console.log('\nAdmin Credentials:');
console.log('EMAIL:', process.env.ADMIN_EMAIL || '❌ NOT SET');
console.log('PASSWORD:', process.env.ADMIN_PASSWORD ? '✅ SET (hidden)' : '❌ NOT SET');

console.log('\nOther:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || '❌ NOT SET');

console.log('\n=== END TEST ===');
