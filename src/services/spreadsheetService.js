const { google } = require('googleapis');
const moment = require('moment');

class SpreadsheetService {
    constructor() {
        this.validateEnvironment();
        this.sheetTitle = 'Transactions';
        this.spreadsheetId = process.env.SPREADSHEET_ID;
    }

    async setupAuth() {
        try {
            // Create credentials object
            const credentials = {
                type: 'service_account',
                project_id: 'whatsapp-finance-tracker',
                private_key_id: 'your_private_key_id',
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                client_id: '',
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
                auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
                client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)}`
            };

            // Create auth client
            const auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            // Get client
            const client = await auth.getClient();
            console.log('Auth client created successfully');

            // Initialize sheets API
            this.sheets = google.sheets({ version: 'v4', auth: client });
        } catch (error) {
            console.error('Error setting up authentication:', error);
            throw error;
        }
    }

    validateEnvironment() {
        if (!process.env.SPREADSHEET_ID) {
            console.error('\n❌ Google Spreadsheet Configuration Error:\n');
            console.error('Missing SPREADSHEET_ID in environment variables\n');
            console.error('Please set up your .env.local file with a valid Google Spreadsheet ID');
            console.error('You can find the Spreadsheet ID in the URL of your Google Sheet:');
            console.error('https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit\n');
            process.exit(1);
        }

        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            console.error('\n❌ Google Service Account Configuration Error:\n');
            console.error('Missing Google Service Account credentials in environment variables');
            console.error('Required variables:');
            console.error('- GOOGLE_SERVICE_ACCOUNT_EMAIL');
            console.error('- GOOGLE_PRIVATE_KEY\n');
            console.error('Please follow the setup instructions in README.md to:');
            console.error('1. Create a Google Cloud Project');
            console.error('2. Enable Google Sheets API');
            console.error('3. Create a Service Account');
            console.error('4. Download the credentials\n');
            process.exit(1);
        }
    }

    async init() {
        try {
            // Set up authentication first
            await this.setupAuth();

            // Get spreadsheet info
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });
            console.log('Successfully connected to Google Spreadsheet:', response.data.properties.title);

            // Check if Transactions sheet exists
            const sheet = response.data.sheets.find(s => s.properties.title === this.sheetTitle);
            
            if (!sheet) {
                // Create new sheet with headers
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    requestBody: {
                        requests: [{
                            addSheet: {
                                properties: {
                                    title: this.sheetTitle
                                }
                            }
                        }]
                    }
                });

                // Add headers
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `${this.sheetTitle}!A1:D1`,
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [['Date', 'Type', 'Amount', 'Description']]
                    }
                });
            }

            console.log('Spreadsheet service initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing spreadsheet:', error);
            throw error;
        }
    }

    async addTransaction({ type, amount, description }) {
        try {
            const date = moment().format('YYYY-MM-DD HH:mm:ss');
            
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetTitle}!A:D`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[date, type, amount, description]]
                }
            });
            
            return true;
        } catch (error) {
            console.error('Error adding transaction:', error);
            throw error;
        }
    }

    async getReport(startDate = null, endDate = null) {
        try {
            // Get all rows
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetTitle}!A:D`
            });

            const rows = response.data.values || [];
            if (rows.length <= 1) { // Only headers or empty
                return {
                    totalIncome: 0,
                    totalExpense: 0,
                    transactions: []
                };
            }

            // Skip header row
            const transactions = rows.slice(1).map(row => ({
                date: row[0],
                type: row[1],
                amount: parseFloat(row[2]),
                description: row[3]
            }));

            let filteredTransactions = transactions;
            if (startDate && endDate) {
                filteredTransactions = transactions.filter(t => 
                    moment(t.date).isBetween(startDate, endDate, 'day', '[]')
                );
            } else {
                const today = moment().format('YYYY-MM-DD');
                filteredTransactions = transactions.filter(t => 
                    moment(t.date).format('YYYY-MM-DD') === today
                );
            }

            const summary = {
                totalIncome: 0,
                totalExpense: 0,
                transactions: filteredTransactions
            };

            filteredTransactions.forEach(t => {
                if (t.type.toLowerCase() === 'income') {
                    summary.totalIncome += t.amount;
                } else if (t.type.toLowerCase() === 'expense') {
                    summary.totalExpense += t.amount;
                }
            });

            return summary;
        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    }
}

module.exports = new SpreadsheetService();
