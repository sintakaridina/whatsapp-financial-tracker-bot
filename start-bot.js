try {
    // Load environment variables
    const result = require('dotenv').config({ path: '.env.local' });
    
    if (result.error) {
        throw new Error(
            'Error loading .env.local file. Please ensure it exists and is properly configured.\n' +
            'Create .env.local file with the following variables:\n' +
            'SPREADSHEET_ID=your_spreadsheet_id_here\n' +
            'GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com\n' +
            'GOOGLE_PRIVATE_KEY="your-private-key-here"'
        );
    }

    // Validate required environment variables
    const requiredEnvVars = [
        'SPREADSHEET_ID',
        'GOOGLE_SERVICE_ACCOUNT_EMAIL',
        'GOOGLE_PRIVATE_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingEnvVars.join(', ')}\n\n` +
            'Please ensure your .env.local file contains all required variables.\n' +
            'See README.md for setup instructions or use this format:\n\n' +
            'SPREADSHEET_ID=your_spreadsheet_id_here\n' +
            'GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com\n' +
            'GOOGLE_PRIVATE_KEY="your-private-key-here"'
        );
    }

    // Initialize WhatsApp bot
    const whatsappBot = require('./src/services/whatsappBot');
    console.log('Starting WhatsApp Financial Tracker Bot...');
    console.log('Waiting for QR Code...');

} catch (error) {
    console.error('\n❌ Failed to start the bot:\n');
    console.error(error.message);
    console.error('\n📖 For setup instructions, please refer to README.md\n');
    process.exit(1);
}
