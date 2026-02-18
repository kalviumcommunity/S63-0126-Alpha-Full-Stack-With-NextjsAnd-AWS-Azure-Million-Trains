import { prisma } from './lib/prisma';

console.log('🔍 Testing Database Connection...\n');

async function testDatabaseConnection() {
    try {
        console.log('📡 Attempting to connect to database...');
        await prisma.$connect();
        console.log('✅ Database connection successful!\n');

        // Test User table
        console.log('📊 Testing User table...');
        const userCount = await prisma.user.count();
        console.log(`✅ User table accessible. Current count: ${userCount}`);

        // Test ContactRequest table
        console.log('📊 Testing ContactRequest table...');
        const contactCount = await prisma.contactRequest.count();
        console.log(`✅ ContactRequest table accessible. Current count: ${contactCount}\n`);

        // Test creating a test user (will rollback)
        console.log('🧪 Testing User creation...');
        const testEmail = `test_${Date.now()}@example.com`;
        const testUser = await prisma.user.create({
            data: {
                fullName: 'Test User',
                email: testEmail,
                password: 'hashed_password_here'
            }
        });
        console.log(`✅ User creation successful! ID: ${testUser.id}`);

        // Clean up test user
        await prisma.user.delete({ where: { id: testUser.id } });
        console.log('✅ Test user cleaned up\n');

        console.log('🎉 All database tests passed!\n');
        return true;
    } catch (error: any) {
        console.error('❌ Database connection failed!');
        console.error('Error:', error.message);

        if (error.code === 'P1001') {
            console.error('\n💡 Possible fixes:');
            console.error('1. Check if Supabase project is active (not paused)');
            console.error('2. Verify DATABASE_URL in .env file');
            console.error('3. Ensure internet connection is working');
        }

        return false;
    } finally {
        await prisma.$disconnect();
    }
}

testDatabaseConnection()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
