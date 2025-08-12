import React, { useState, useCallback } from 'react';
import { Upload, CheckCircle, AlertCircle, Copy, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';

const BankStatementCategorizer = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [categorizedData, setCategorizedData] = useState(null);

  const categorizeTransaction = (narration, amount) => {
    const desc = (narration || '').toLowerCase();

    // Stock Dividends - ACH credits from companies AND UPI dividend payments
    if (desc.includes('ach c-') ||
        (desc.includes('upi-') && (desc.includes('div') || desc.includes('dividend'))) ||
        desc.includes('int div') || desc.includes('fnldiv') ||
        (desc.includes('360 one') && desc.includes('div')) ||
        (desc.includes('r r kabel') && desc.includes('div')) ||
        (desc.includes('steelcast') && desc.includes('div')) ||
        (desc.includes('arvind') && desc.includes('div')) ||
        (desc.includes('godfrey') && desc.includes('div')) ||
        (desc.includes('carysil') && desc.includes('div')) ||
        (desc.includes('kirloskar') && desc.includes('div')) ||
        desc.includes('ador int div')) {
      return 'Stock Dividend Income';
    }

    // Salary - NEFT from PhonePe Lending Services
    if (desc.includes('neft cr-') && desc.includes('phonepe lending services')) {
      return 'Salary';
    }

    // Saving Interest - Interest paid notifications
    if (desc.includes('interest paid till')) {
      return 'Saving Interest';
    }

    // Self Transfer from Axis - IMPS with own name ANSHULAGARWAL and UTIB
    if (desc.includes('imps-') && desc.includes('anshulagarwal') && desc.includes('utib')) {
      return 'Self Transfer From Axis';
    }

    // Om Marketing Transfer - TPT transactions with specific patterns
    if (desc.includes('tpt-') && (desc.includes('anmol associates') || desc.includes('om marketing') || desc.includes('rajeev kumar agarwal'))) {
      return 'Om Marketing Transfer';
    }

    // Loan EMI - ACH D- HDFC BANK LTD with large amounts (~86000) OR HDFC housing loan UPI
    if ((desc.includes('ach d- hdfc bank ltd') && amount > 80000) ||
        (desc.includes('upi-hdfc bank ltd housin') || desc.includes('hdfcltd') && desc.includes('hdfc'))) {
      return 'Loan EMI';
    }

    // Life Insurance EMI - LIC Premium and HLIC INST
    if ((desc.includes('lic') && desc.includes('premium')) || desc.includes('hlic inst')) {
      return 'Life Insurance EMI';
    }

    // Entertainment - Netflix, Bigtree Entertainment, movie bookings
    if (desc.includes('netflix') || desc.includes('bigtree entertainmen') || desc.includes('bookmyshow')) {
      return 'Entertainment';
    }

    // Stock Market Transfer Refund - refunds from trading platforms (both UPI and NEFT)
    if (((desc.includes('zerodha') || desc.includes('groww') || desc.includes('upstox')) &&
        (desc.includes('refund') || desc.includes('reversal'))) ||
        (desc.includes('neft cr-') && desc.includes('zerodha broking ltd'))) {
      return 'Stock Market Transfer Refund';
    }

    // Mutual Fund SIP - ACH debits for SIP, Zerodha Coin, and UPI-INDIANCLEARINGCORPOR
    if ((desc.includes('ach d-') && desc.includes('indian clearing corp')) ||
        desc.includes('zerodha coin') ||
        desc.includes('upi-indianclearingcorpor') ||
        (desc.includes('bse') && desc.includes('limited'))) {
      return 'Mutual Fund SIP';
    }

    // Stock Market Transfer - transfers to trading platforms (excluding refunds)
    if (((desc.includes('zerodha') && !desc.includes('coin')) || desc.includes('groww') || desc.includes('upstox') ||
        desc.includes('angel') || desc.includes('iifl') || desc.includes('trading') ||
        desc.includes('demat') || desc.includes('securities')) &&
        !desc.includes('refund') && !desc.includes('reversal')) {
      return 'Stock Market Transfer';
    }

    // Credit Card Payment - CRED and credit card payments
    if (desc.includes('cred') || desc.includes('credit card') || desc.includes('cc payment')) {
      return 'Credit Card Payment';
    }

    // General refund categorization - match refunds to appropriate expense categories
    if (desc.includes('refund') || desc.includes('reversal')) {
      // Food platform refunds - use Food Refund category
      if (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('blinkit') ||
          desc.includes('dunzo') || desc.includes('grofers') || desc.includes('bigbasket')) {
        return 'Food Refund';
      }
      // Apple refunds
      if (desc.includes('apple')) {
        return 'Apple Refund';
      }
      // Stock market refunds
      if (desc.includes('zerodha') || desc.includes('groww') || desc.includes('upstox') ||
          desc.includes('angel') || desc.includes('iifl')) {
        return 'Stock Market Transfer Refund';
      }
      // Entertainment refunds - use Entertainment category
      if (desc.includes('netflix') || desc.includes('bigtree') || desc.includes('bookmyshow')) {
        return 'Entertainment';
      }
      // Shopping refunds - use Shopping category
      if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra')) {
        return 'Shopping';
      }
      // General refund category for others
      return 'Refund';
    }

    // Food & Dining - food delivery and restaurants (including grocery delivery)
    if (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('pizza') ||
        desc.includes('dominos') || desc.includes('mcdonalds') || desc.includes('kfc') ||
        desc.includes('restaurant') || desc.includes('food') ||
        desc.includes('blinkit') || desc.includes('dunzo') || desc.includes('grofers') || desc.includes('bigbasket')) {
      return 'Food & Dining';
    }

    // Apple Refund - Apple related refunds
    if (desc.includes('apple') && (desc.includes('refund') || desc.includes('reversal'))) {
      return 'Apple Refund';
    }

    // Rent - rent payments (high amount UPI or explicit rent)
    if (desc.includes('rent') || (amount > 15000 && desc.includes('upi') && !desc.includes('cred'))) {
      return 'Rent';
    }

    // Mobile/Internet - telecom services
    if (desc.includes('jio') || desc.includes('airtel') || desc.includes('vi ') ||
        desc.includes('vodafone') || desc.includes('prepaid') || desc.includes('recharge') ||
        desc.includes('mobile') || desc.includes('telecom')) {
      return 'Mobile/Internet';
    }

    // Shopping - online shopping platforms
    if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra') ||
        desc.includes('shopping') || desc.includes('mart') || desc.includes('store') ||
        desc.includes('purchase')) {
      return 'Shopping';
    }

    // Transportation - ride sharing and fuel
    if (desc.includes('uber') || desc.includes('ola') || desc.includes('taxi') ||
        desc.includes('metro') || desc.includes('fuel') || desc.includes('petrol') ||
        desc.includes('transport') || desc.includes('cab')) {
      return 'Transportation';
    }

    // ATM withdrawals
    if (desc.includes('atm') || desc.includes('cash withdrawal') || desc.includes('cash wd')) {
      return 'Cash Withdrawal';
    }

    // Healthcare
    if (desc.includes('hospital') || desc.includes('medical') || desc.includes('pharmacy') ||
        desc.includes('doctor') || desc.includes('health') || desc.includes('clinic')) {
      return 'Healthcare';
    }

    // Bank charges and fees
    if (desc.includes('charges') || desc.includes('fee') || desc.includes('penalty') ||
        desc.includes('service charge') || desc.includes('annual fee')) {
      return 'Bank Charges';
    }

    // Investment/SIP related (other patterns)
    if (desc.includes('sip') || desc.includes('mutual fund') || desc.includes('investment') ||
        desc.includes('bse') || desc.includes('nse')) {
      return 'Investment/SIP';
    }

    // General refund category
    if (desc.includes('refund') || desc.includes('reversal') || desc.includes('return')) {
      return 'Refund';
    }

    // Default category
    return 'Other Expenses';
  };

  // Helper function to extract merchant name from transaction description
  const extractMerchantName = (narration) => {
    const desc = narration.toLowerCase();
    if (desc.includes('blinkit')) return 'blinkit';
    if (desc.includes('swiggy')) return 'swiggy';
    if (desc.includes('zomato')) return 'zomato';
    if (desc.includes('amazon')) return 'amazon';
    if (desc.includes('flipkart')) return 'flipkart';
    if (desc.includes('netflix')) return 'netflix';
    if (desc.includes('apple')) return 'apple';
    if (desc.includes('zerodha')) return 'zerodha';
    if (desc.includes('grofers')) return 'grofers';
    if (desc.includes('bigbasket')) return 'bigbasket';
    if (desc.includes('dunzo')) return 'dunzo';
    return null;
  };

  // Helper function to get appropriate refund category based on merchant
  const getRefundCategory = (merchant) => {
    if (['blinkit', 'swiggy', 'zomato', 'grofers', 'bigbasket', 'dunzo'].includes(merchant)) {
      return 'Food Refund';
    }
    if (merchant === 'apple') return 'Apple Refund';
    if (merchant === 'zerodha') return 'Stock Market Transfer Refund';
    if (['amazon', 'flipkart'].includes(merchant)) return 'Shopping Refund';
    if (merchant === 'netflix') return 'Entertainment Refund';
    return 'Refund';
  };

  const processFile = useCallback(async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Generic header detection for different bank formats
      let headerRow = -1;
      let columnMapping = {};

      // Look for headers in first 50 rows
      for (let i = 0; i < Math.min(50, jsonData.length); i++) {
        if (jsonData[i] && jsonData[i].length > 3) {
          const row = jsonData[i];
          const rowStr = row.join(' ').toLowerCase();

          // Check for different header patterns
          if (headerRow === -1 && (
            // Pattern 1: HDFC format (Date, Narration, Withdrawal Amt, Deposit Amt)
            (rowStr.includes('date') && rowStr.includes('narration') && (rowStr.includes('withdrawal') || rowStr.includes('debit'))) ||
            // Pattern 2: Axis format (Tran Date, Particulars, DR, CR)
            (rowStr.includes('tran date') && rowStr.includes('particulars') && rowStr.includes('dr') && rowStr.includes('cr')) ||
            // Pattern 3: Generic format
            (rowStr.includes('date') && rowStr.includes('description') && (rowStr.includes('amount') || rowStr.includes('debit') || rowStr.includes('credit')))
          )) {
            headerRow = i;

            // Map columns based on header content
            for (let j = 0; j < row.length; j++) {
              const header = (row[j] || '').toString().toLowerCase();

              // Date column
              if (header.includes('date') || header.includes('dt')) {
                columnMapping.date = j;
              }
              // Description/Narration/Particulars column
              else if (header.includes('narration') || header.includes('description') ||
                       header.includes('particulars') || header.includes('details')) {
                columnMapping.description = j;
              }
              // Withdrawal/Debit column
              else if (header.includes('withdrawal') || header.includes('debit') || header.includes('dr')) {
                columnMapping.withdrawal = j;
              }
              // Deposit/Credit column
              else if (header.includes('deposit') || header.includes('credit') || header.includes('cr')) {
                columnMapping.deposit = j;
              }
              // Balance column
              else if (header.includes('balance') || header.includes('bal')) {
                columnMapping.balance = j;
              }
              // Reference/Check number
              else if (header.includes('ref') || header.includes('chq') || header.includes('check')) {
                columnMapping.reference = j;
              }
            }

            console.log(`Found header at row ${i + 1}:`, row);
            console.log('Column mapping:', columnMapping);
            break;
          }
        }
      }

      if (headerRow === -1) {
        throw new Error('Could not find header row in the statement. Please ensure your file contains standard bank statement headers.');
      }

      // Validate essential columns
      if (columnMapping.date === undefined || columnMapping.description === undefined) {
        throw new Error('Missing essential columns (Date and Description/Narration/Particulars). Please check your file format.');
      }

      // If no separate DR/CR columns, look for a single Amount column
      if (columnMapping.withdrawal === undefined && columnMapping.deposit === undefined) {
        for (let j = 0; j < jsonData[headerRow].length; j++) {
          const header = (jsonData[headerRow][j] || '').toString().toLowerCase();
          if (header.includes('amount')) {
            columnMapping.amount = j;
            break;
          }
        }
      }

      // First pass: Collect all transactions and identify refund pairs
      const transactions = [];
      for (let i = headerRow + 1; i < jsonData.length; i++) {
        if (jsonData[i] && jsonData[i].length > Math.max(columnMapping.date, columnMapping.description)) {
          const row = jsonData[i];

          // Extract transaction data based on column mapping
          const date = row[columnMapping.date];
          const description = row[columnMapping.description] || '';

          let withdrawalAmount = 0;
          let depositAmount = 0;

          // Handle different amount column structures
          if (columnMapping.withdrawal !== undefined && columnMapping.deposit !== undefined) {
            // Separate DR/CR columns
            const drStr = (row[columnMapping.withdrawal] || '').toString().trim();
            const crStr = (row[columnMapping.deposit] || '').toString().trim();

            withdrawalAmount = drStr && drStr !== '' && drStr !== ' ' ? parseFloat(drStr.replace(/,/g, '')) || 0 : 0;
            depositAmount = crStr && crStr !== '' && crStr !== ' ' ? parseFloat(crStr.replace(/,/g, '')) || 0 : 0;
          } else if (columnMapping.amount !== undefined) {
            // Single amount column - determine if positive or negative
            const amountStr = (row[columnMapping.amount] || '').toString().trim();
            const amount = parseFloat(amountStr.replace(/,/g, '')) || 0;

            if (amount > 0) {
              depositAmount = amount;
            } else if (amount < 0) {
              withdrawalAmount = Math.abs(amount);
            }
          }

          // Only process rows with valid data
          if (date && description && (withdrawalAmount > 0 || depositAmount > 0)) {
            transactions.push({
              rowIndex: i,
              date: date,
              narration: description,
              withdrawal: withdrawalAmount,
              deposit: depositAmount,
              amount: withdrawalAmount > 0 ? withdrawalAmount : depositAmount,
              isRefund: false,
              refundCategory: null
            });
          }
        }
      }

      // Find refund pairs by matching amounts and merchant names
      for (let i = 0; i < transactions.length; i++) {
        const txn = transactions[i];
        if (txn.withdrawal > 0 && !txn.isRefund) { // It's a payment
          // Look for matching refund (same amount, similar merchant)
          for (let j = 0; j < transactions.length; j++) {
            const refundTxn = transactions[j];
            if (i !== j && refundTxn.deposit > 0 && !refundTxn.isRefund &&
                Math.abs(txn.withdrawal - refundTxn.deposit) < 0.01) { // Same amount

              // Check if they're from similar merchants
              const txnMerchant = extractMerchantName(txn.narration);
              const refundMerchant = extractMerchantName(refundTxn.narration);

              if (txnMerchant && refundMerchant && txnMerchant === refundMerchant) {
                // Found a refund pair!
                const refundCategory = getRefundCategory(txnMerchant);
                txn.isRefund = true;
                txn.refundCategory = refundCategory;
                refundTxn.isRefund = true;
                refundTxn.refundCategory = refundCategory;
                break;
              }
            }
          }
        }
      }

      // Second pass: Process transactions with enhanced data
      const enhancedData = [];
      const headers = [...jsonData[headerRow], 'Transaction Category'];
      enhancedData.push(headers);

      let withdrawalCount = 0;
      let depositCount = 0;
      const categoryStats = {};
      const withdrawalDetails = [];

      for (let i = headerRow + 1; i < jsonData.length; i++) {
        if (jsonData[i] && jsonData[i].length > 0) {
          const row = [...jsonData[i]];

          // Find this transaction in our processed list
          const processedTxn = transactions.find(t => t.rowIndex === i);
          let category = '';

          if (processedTxn) {
            if (processedTxn.isRefund) {
              // Use refund category for both payment and refund
              category = processedTxn.refundCategory;
            } else if (processedTxn.withdrawal > 0) {
              // Regular withdrawal
              category = categorizeTransaction(processedTxn.narration, processedTxn.withdrawal);
              withdrawalCount++;
            } else if (processedTxn.deposit > 0) {
              // Regular deposit
              category = categorizeTransaction(processedTxn.narration, processedTxn.deposit);
              if (category === 'Stock Dividend Income' || category === 'Salary' || category === 'Saving Interest' ||
                  category === 'Self Transfer From Axis' || category === 'Om Marketing Transfer' || category === 'Refund' ||
                  category === 'Stock Market Transfer Refund' || category === 'Food Refund' || category === 'Apple Refund' ||
                  category === 'Entertainment' || category === 'Shopping') {
                depositCount++;
              } else {
                category = ''; // Don't categorize regular deposits
              }
            }

            if (category) {
              categoryStats[category] = (categoryStats[category] || 0) + 1;
              withdrawalDetails.push({
                date: processedTxn.date,
                narration: processedTxn.narration,
                amount: processedTxn.amount,
                category: category,
                type: processedTxn.withdrawal > 0 ? 'withdrawal' : 'deposit'
              });
            }
          }

          row.push(category);
          enhancedData.push(row);
        }
      }

      setCategorizedData(enhancedData);
      setResults({
        totalTransactions: enhancedData.length - 1,
        withdrawalTransactions: withdrawalCount,
        depositTransactions: depositCount,
        categoryStats,
        withdrawalDetails,
        headers
      });

    } catch (err) {
      setError(`Error processing file: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  }, [file]);

  const copyTableData = () => {
    if (!categorizedData) return;

    const csvContent = categorizedData.map(row =>
      row.map(cell => `"${cell || ''}"`).join(',')
    ).join('\n');

    navigator.clipboard.writeText(csvContent).then(() => {
      alert('Table data copied to clipboard! You can paste it into Excel.');
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = csvContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Table data copied to clipboard! You can paste it into Excel.');
    });
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setResults(null);
      setError(null);
      setShowTable(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank Statement Transaction Categorizer</h1>
        <p className="text-gray-600">
          Upload your Excel bank statement to automatically categorize withdrawals into expenses, mutual fund EMIs, and stock market transfers.
        </p>
      </div>

      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="mb-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-blue-600 hover:text-blue-500 font-medium">
              Click to upload your Excel bank statement
            </span>
            <input
              id="file-upload"
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
        {file && (
          <div className="text-sm text-gray-600 mb-4">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
        <button
          onClick={processFile}
          disabled={!file || processing}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : 'Categorize Transactions'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {results && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-green-800">Processing Complete!</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{results.totalTransactions}</div>
              <div className="text-sm text-gray-600">Total Transactions</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-red-600">{results.withdrawalTransactions}</div>
              <div className="text-sm text-gray-600">Withdrawal Transactions</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{results.depositTransactions || 0}</div>
              <div className="text-sm text-gray-600">Categorized Deposits</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(results.categoryStats).length}</div>
              <div className="text-sm text-gray-600">Categories Identified</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Category Breakdown:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(results.categoryStats)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center bg-white p-2 rounded border">
                    <span className="text-sm font-medium">{category}</span>
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{count}</span>
                  </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowTable(!showTable)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showTable ? 'Hide' : 'View'} Categorized Data
            </button>

            <button
              onClick={copyTableData}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Data (Paste in Excel)
            </button>
          </div>

          {showTable && categorizedData && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Categorized Transaction Data:</h3>
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {results.headers.map((header, index) => (
                          <th key={index} className="px-3 py-2 text-left font-medium text-gray-900 border-b">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categorizedData.slice(1, 101).map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 border-b text-gray-900">
                              {cellIndex === results.headers.length - 1 && cell ? (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {cell}
                                </span>
                              ) : (
                                <span className="block max-w-xs truncate" title={cell}>
                                  {cell || ''}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {categorizedData.length > 101 && (
                  <div className="p-3 bg-gray-50 text-sm text-gray-600 text-center">
                    Showing first 100 rows. Complete data is available when you copy it.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">How to Get Your Categorized File:</h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-2">
          <li>After processing, click <strong>"Copy Data (Paste in Excel)"</strong></li>
          <li>Open Microsoft Excel or Google Sheets</li>
          <li>Create a new blank worksheet</li>
          <li>Press <strong>Ctrl+V</strong> (or Cmd+V on Mac) to paste the data</li>
          <li>Save the file as an Excel file (.xlsx)</li>
          <li>Your transactions are now categorized in the last column!</li>
        </ol>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Categories Explained:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-blue-700 mb-1">Income Categories:</div>
            <ul className="list-disc list-inside text-blue-600 space-y-1">
              <li><strong>Stock Dividend Income:</strong> All ACH credit transactions from companies AND UPI dividend payments (DIV, INT DIV, FNLDIV patterns)</li>
              <li><strong>Salary:</strong> NEFT credits from PhonePe Lending Services</li>
              <li><strong>Saving Interest:</strong> Interest paid by bank on savings</li>
              <li><strong>Self Transfer From Axis:</strong> IMPS transfers from your Axis account</li>
              <li><strong>Om Marketing Transfer:</strong> TPT transfers from business associates</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-blue-700 mb-1">Investment Categories:</div>
            <ul className="list-disc list-inside text-blue-600 space-y-1">
              <li><strong>Mutual Fund SIP:</strong> ACH debits for SIPs, Zerodha Coin purchases, UPI-INDIANCLEARINGCORPOR transactions</li>
              <li><strong>Stock Market Transfer:</strong> Transfers to trading platforms</li>
              <li><strong>Stock Market Transfer Refund:</strong> Refunds from trading platforms (UPI refunds/reversals and NEFT credits from Zerodha Broking Ltd)</li>
            </ul>

            <div className="font-medium text-blue-700 mb-1 mt-3">Loan & Insurance:</div>
            <ul className="list-disc list-inside text-blue-600 space-y-1">
              <li><strong>Loan EMI:</strong> HDFC Bank loan payments (ACH debits ~₹86,000 and UPI housing loan payments)</li>
              <li><strong>Life Insurance EMI:</strong> LIC premium payments and HDFC Life Insurance (HLIC INST) payments</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
          <div>
            <div className="font-medium text-blue-700 mb-1">Expense Categories:</div>
            <ul className="list-disc list-inside text-blue-600 space-y-1">
              <li><strong>Food & Dining:</strong> Swiggy, Zomato, restaurants, grocery delivery (Blinkit, BigBasket, Grofers, Dunzo)</li>
              <li><strong>Entertainment:</strong> Netflix, BookMyShow, Bigtree Entertainment</li>
              <li><strong>Rent:</strong> Monthly rent payments</li>
              <li><strong>Shopping:</strong> Amazon, Flipkart, retail purchases</li>
              <li><strong>Mobile/Internet:</strong> Telecom recharges and bills</li>
              <li><strong>Credit Card Payment:</strong> Credit card bill payments</li>
              <li><strong>Transportation:</strong> Uber, Ola, fuel expenses</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-blue-700 mb-1">Refund Categories:</div>
            <ul className="list-disc list-inside text-blue-600 space-y-1">
              <li><strong>Food Refund:</strong> Only actual refunds from food/grocery platforms (must contain "refund" keyword)</li>
              <li><strong>Apple Refund:</strong> Apple-related refunds</li>
              <li><strong>Shopping:</strong> Amazon/Flipkart refunds (both payments and refunds use same category)</li>
              <li><strong>Entertainment:</strong> Netflix/BookMyShow refunds (both payments and refunds use same category)</li>
              <li><strong>Refund:</strong> Other general refunds and reversals</li>
              <li><strong>Bank Charges:</strong> Fees and service charges</li>
              <li><strong>Other Expenses:</strong> Miscellaneous spending (includes utilities, bills, and other general expenses)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankStatementCategorizer;