const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const moment = require('moment');
const spreadsheetService = require('./spreadsheetService');

class WhatsAppBot {
    constructor() {
        // Check for required environment variables before initializing
        this.validateEnvironment();

        // In-memory map to track report interaction state per user
        this.reportState = new Map();
        
this.client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-features=AudioServiceOutOfProcess',
            '--disable-breakpad',
            '--disable-client-side-phishing-detection',
            '--disable-component-update',
            '--disable-default-apps',
            '--disable-domain-reliability',
            '--disable-extensions',
            '--disable-features=TranslateUI,BlinkGenPropertyTrees',
            '--disable-hang-monitor',
            '--disable-ipc-flooding-protection',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-renderer-backgrounding',
            '--disable-sync',
            '--metrics-recording-only',
            '--safebrowsing-disable-auto-update',
            '--enable-automation',
            '--password-store=basic',
            '--use-mock-keychain',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--mute-audio'
        ],
        dumpio: true
    }
});
this.initializeBot();

// Add error handling for client errors
this.client.on('auth_failure', msg => {
    console.error('Authentication failure:', msg);
});
this.client.on('disconnected', reason => {
    console.warn('Client disconnected:', reason);
});
this.client.on('error', error => {
    console.error('Client error:', error);
});
    }

    validateEnvironment() {
        const requiredEnvVars = [
            'SPREADSHEET_ID',
            'GOOGLE_SERVICE_ACCOUNT_EMAIL',
            'GOOGLE_PRIVATE_KEY'
        ];

        const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingEnvVars.length > 0) {
            console.error('\n❌ Environment Configuration Error:\n');
            console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}\n`);
            console.error('Please set up your .env.local file with the following variables:');
            console.error('SPREADSHEET_ID=your_spreadsheet_id_here');
            console.error('GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com');
            console.error('GOOGLE_PRIVATE_KEY="your-private-key-here"\n');
            console.error('📖 For detailed setup instructions, please refer to README.md\n');
            process.exit(1);
        }
    }

    initializeBot() {
        // Handle QR Code generation
        this.client.on('qr', (qr) => {
            qrcode.generate(qr, { small: true });
            console.log('QR Code telah dibuat. Silakan scan dengan WhatsApp.');
        });

        // Handle successful authentication
        this.client.on('ready', () => {
            console.log('Fadhil 🦁 siap digunakan!');
            spreadsheetService.init()
                .then(() => console.log('Layanan spreadsheet berhasil diinisialisasi'))
                .catch(err => console.error('Terjadi kesalahan saat menginisialisasi spreadsheet:', err));
        });

        // Handle incoming messages
        this.client.on('message', async msg => {
            try {
                const userId = msg.from;
                const command = msg.body.trim().toLowerCase();

                // Check if user is in report interaction state
                if (this.reportState.has(userId)) {
                    await this.handleReportInteraction(msg, userId, command);
                    return;
                }
                
                if (command.startsWith('!in') || command.startsWith('!out')) {
                    await this.handleTransaction(msg);
                } else if (command.startsWith('!report')) {
                    await this.handleReport(msg);
                } else if (command === '!help') {
                    await this.sendHelpMessage(msg);
                }
            } catch (error) {
                console.error('Error processing message:', error);
            msg.reply('Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.');
            }
        });

        // Initialize the client
        this.client.initialize();
    }

    async handleTransaction(msg) {
        try {
            const parts = msg.body.split(' ');
            const type = parts[0].toLowerCase() === '!in' ? 'income' : 'expense';
            
            // Remove command and get amount
            const amount = parseFloat(parts[1].replace(/[.,]/g, ''));
            if (isNaN(amount)) {
                return msg.reply('Format jumlah tidak valid. Gunakan format: !in/!out jumlah deskripsi');
            }

            // Get description (everything after amount)
            const description = parts.slice(2).join(' ').trim();
            if (!description) {
                return msg.reply('Silakan berikan deskripsi untuk transaksi.');
            }

            await spreadsheetService.addTransaction({
                type,
                amount,
                description
            });

            const response = `✅ ${type.charAt(0).toUpperCase() + type.slice(1)} recorded:\n` +
                           `Amount: ${amount.toLocaleString('id-ID')}\n` +
                           `Description: ${description}`;
            
            msg.reply(response);
        } catch (error) {
            console.error('Error handling transaction:', error);
            msg.reply('Terjadi kesalahan saat mencatat transaksi. Silakan coba lagi.');
        }
    }

    async handleReport(msg) {
        try {
            const userId = msg.from;
            // Start report interaction by sending options
            this.reportState.set(userId, { step: 'chooseOption' });
            const optionsMessage = 
                'Pilih opsi laporan keuangan:\n' +
                '1️⃣ Hari ini\n' +
                '2️⃣ Custom tanggal (format: DD-MM-YYYY DD-MM-YYYY)\n\n' +
                'Kirim angka 1 atau 2 untuk memilih opsi.';
            await msg.reply(optionsMessage);
        } catch (error) {
            console.error('Error starting report interaction:', error);
            msg.reply('Error memulai laporan. Silakan coba lagi.');
        }
    }

    async handleReportInteraction(msg, userId, command) {
        try {
            const state = this.reportState.get(userId);

            if (state.step === 'chooseOption') {
                if (command === '1') {
                    // Send today's report
                    const report = await spreadsheetService.getReport();
                    await this.sendReportMessage(msg, report, 'Laporan Finansial - Hari ini');
                    this.reportState.delete(userId);
                } else if (command === '2') {
                    // Ask for date range input
                    this.reportState.set(userId, { step: 'awaitDateRange' });
                    await msg.reply('Silakan kirim rentang tanggal dengan format: DD-MM-YYYY DD-MM-YYYY');
                } else {
                    await msg.reply('Pilihan tidak valid. Silakan kirim angka 1 atau 2.');
                }
            } else if (state.step === 'awaitDateRange') {
                // Parse date range
                const parts = command.split(' ');
                if (parts.length === 2) {
                    const startDate = moment(parts[0], 'DD-MM-YYYY');
                    const endDate = moment(parts[1], 'DD-MM-YYYY');
                    if (!startDate.isValid() || !endDate.isValid()) {
                        await msg.reply('Format tanggal tidak valid. Gunakan format: DD-MM-YYYY DD-MM-YYYY');
                        return;
                    }
                    const report = await spreadsheetService.getReport(startDate, endDate);
                    await this.sendReportMessage(
                        msg,
                        report,
                        `Laporan Finansial - ${startDate.format('DD MMM YYYY')} sampai ${endDate.format('DD MMM YYYY')}`
                    );
                    this.reportState.delete(userId);
                } else {
                        await msg.reply('Format tidak sesuai. Kirim rentang tanggal dengan format: DD-MM-YYYY DD-MM-YYYY');
                }
            }
        } catch (error) {
            console.error('Error handling report interaction:', error);
            msg.reply('Terjadi kesalahan saat memproses laporan. Silakan coba lagi.');
            this.reportState.delete(userId);
        }
    }

    async sendReportMessage(msg, report, period) {
        const { totalIncome, totalExpense, transactions } = report;
        const balance = totalIncome - totalExpense;

        let message = `📊 Financial Report (${period})\n\n`;
        message += `💰 Total Income: ${totalIncome.toLocaleString('id-ID')}\n`;
        message += `💸 Total Expense: ${totalExpense.toLocaleString('id-ID')}\n`;
        message += `${balance >= 0 ? '✅' : '❌'} Balance: ${balance.toLocaleString('id-ID')}\n\n`;

        if (transactions.length > 0) {
            message += '📝 Recent Transactions:\n';
            transactions.slice(0, 5).forEach(t => {
                message += `${t.type === 'income' ? '➕' : '➖'} ${t.amount.toLocaleString('id-ID')} - ${t.description}\n`;
            });
        } else {
            message += 'No transactions found for this period.';
        }

        msg.reply(message);
    }

    async sendHelpMessage(msg) {
            const helpMessage = 
            '🤖 *Perintah Bot Fadhil 🦁*\n\n' +
            '1️⃣ Catat Pemasukan:\n' +
            '!in <jumlah> <deskripsi>\n' +
            'Contoh: !in 5000000 gaji\n\n' +
            '2️⃣ Catat Pengeluaran:\n' +
            '!out <jumlah> <deskripsi>\n' +
            'Contoh: !out 50000 makan siang\n\n' +
            '3️⃣ Dapatkan Laporan:\n' +
            '• !report - Laporan hari ini\n' +
            '• !report DD-MM-YYYY DD-MM-YYYY - Rentang tanggal khusus\n' +
            'Contoh: !report 01-06-2024 17-06-2024\n\n' +
            '4️⃣ Bantuan:\n' +
            '!help - Tampilkan pesan ini';

        msg.reply(helpMessage);
    }
}

module.exports = new WhatsAppBot();
