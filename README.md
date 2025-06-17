# WhatsApp Financial Tracker Bot

A WhatsApp bot that helps you track your finances using Google Spreadsheet integration. Record income, expenses, and generate financial reports directly through WhatsApp.

## Features

- Record income and expenses with simple commands
- Generate financial reports (daily or custom date range)
- Data stored in Google Spreadsheet for easy access and backup
- Simple and intuitive command interface

## Setup Instructions

1. **Google Spreadsheet Setup:**
   - Create a new Google Spreadsheet
   - Create a Google Cloud Project and enable Google Sheets API
   - Create a service account and download the credentials
   - Share your spreadsheet with the service account email

2. **Environment Configuration:**
   - Copy the `.env.local.example` to `.env.local`
   - Fill in the following details:
     ```
     SPREADSHEET_ID=your_spreadsheet_id_here
     GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
     GOOGLE_PRIVATE_KEY="your-private-key-here"
     ```

3. **Installation:**
   ```bash
   npm install
   ```

4. **Start the Bot:**
   ```bash
   npm run bot
   ```
   - Scan the QR code with WhatsApp to authenticate
   - The bot is now ready to use!

## Commands

1. **Record Income:**
   ```
   !in <amount> <description>
   ```
   Example: `!in 5000000 salary`

2. **Record Expense:**
   ```
   !out <amount> <description>
   ```
   Example: `!out 50000 lunch`

3. **Get Reports:**
   - Today's report:
     ```
     !report
     ```
   - Custom date range:
     ```
     !report DD-MM-YYYY DD-MM-YYYY
     ```
     Example: `!report 01-06-2024 17-06-2024`

4. **Help:**
   ```
   !help
   ```
   Shows all available commands and their usage

## Response Examples

1. **Transaction Recording:**
   ```
   ✅ Income recorded:
   Amount: 5,000,000
   Description: salary
   ```

2. **Report:**
   ```
   📊 Financial Report (Today)

   💰 Total Income: 5,000,000
   💸 Total Expense: 50,000
   ✅ Balance: 4,950,000

   📝 Recent Transactions:
   ➕ 5,000,000 - salary
   ➖ 50,000 - lunch
   ```

## Notes

- Amounts should be entered without currency symbols or decimal points
- Dates in reports should be in DD-MM-YYYY format
- The bot needs to be running continuously to receive and process messages
- Make sure to keep your WhatsApp connected to maintain the bot's functionality

## Error Handling

The bot includes error handling for:
- Invalid command formats
- Invalid amounts
- Invalid dates
- Missing descriptions
- API failures

If you encounter any issues, the bot will respond with helpful error messages to guide you.
