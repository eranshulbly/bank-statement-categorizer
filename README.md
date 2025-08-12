# Bank Statement Transaction Categorizer

A React-based web application that automatically categorizes bank statement transactions into meaningful categories like expenses, investments, EMIs, and income.

## Features

- **Smart Categorization**: Automatically categorizes transactions into 20+ categories
- **Refund Matching**: Identifies payment-refund pairs and groups them together
- **Excel Integration**: Copy categorized data directly to Excel/Google Sheets
- **Real-time Processing**: Process large bank statements instantly
- **Mobile Friendly**: Works on all devices

## Categories Supported

### Income
- Stock Dividend Income
- Salary
- Saving Interest
- Self Transfers
- Business Transfers

### Investments
- Mutual Fund SIP
- Stock Market Transfers
- Investment Refunds

### Expenses
- Food & Dining
- Entertainment
- Rent
- Shopping
- Credit Card Payments
- Loan EMIs
- Life Insurance
- And more...

## How to Use

1. Upload your Excel bank statement (.xls or .xlsx)
2. Click "Categorize Transactions"
3. Review the categorized results
4. Click "Copy Data" to copy to clipboard
5. Paste into Excel and save

## Local Development

```bash
npm install
npm start
```

## Deployment

This app is ready for deployment on Netlify, Vercel, or any static hosting platform.

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

The copy functionality includes fallbacks for older browsers.