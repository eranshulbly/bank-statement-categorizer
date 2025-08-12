import React, { useState, useCallback, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Copy, Eye, Brain } from 'lucide-react';
import * as XLSX from 'xlsx';

const MLBankStatementCategorizer = () => {
  const [file, setFile] = useState(null);
  const [trainingFile, setTrainingFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [training, setTraining] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [categorizedData, setCategorizedData] = useState(null);
  const [learningData, setLearningData] = useState([]);
  const [showLearning, setShowLearning] = useState(false);
  const [modelAccuracy, setModelAccuracy] = useState(0);
  const [trainingSuccess, setTrainingSuccess] = useState(null);

  // Categories for ML training
  const categories = [
    'Stock Dividend Income', 'Salary', 'Saving Interest', 'Self Transfer From Axis', 'Om Marketing Transfer',
    'Mutual Fund SIP', 'Stock Market Transfer', 'Stock Market Transfer Refund', 'Loan EMI', 'Life Insurance EMI',
    'Entertainment', 'Food & Dining', 'Food Refund', 'Apple Refund', 'Rent', 'Mobile/Internet', 'Shopping',
    'Transportation', 'Cash Withdrawal', 'Healthcare', 'Bank Charges', 'Credit Card Payment', 'Refund', 'Other Expenses'
  ];

  // Load learning data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bankCategorizerLearningData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setLearningData(data);
        calculateAccuracy(data);
      } catch (e) {
        console.log('Error loading learning data:', e);
      }
    }
  }, []);

  // Calculate model accuracy based on learning data
  const calculateAccuracy = (data) => {
    if (data.length === 0) {
      setModelAccuracy(0);
      return;
    }

    const correctPredictions = data.filter(item =>
      item.originalCategory === item.correctCategory
    ).length;

    const accuracy = (correctPredictions / data.length) * 100;
    setModelAccuracy(Math.round(accuracy));
  };

  // Save learning data to localStorage
  const saveLearningData = (data) => {
    localStorage.setItem('bankCategorizerLearningData', JSON.stringify(data));
    calculateAccuracy(data);
  };

  // Extract features from transaction text (ML-like feature engineering)
  const extractFeatures = (description, amount) => {
    const text = description.toLowerCase();
    const features = {};

    // Keyword features
    const keywords = {
      financial: ['bank', 'hdfc', 'icici', 'axis', 'sbi', 'kotak'],
      payment: ['upi', 'neft', 'imps', 'ach', 'rtgs', 'payment'],
      merchants: ['swiggy', 'zomato', 'amazon', 'flipkart', 'netflix', 'spotify'],
      investment: ['zerodha', 'groww', 'sip', 'dividend', 'mutual', 'fund'],
      utilities: ['electricity', 'water', 'gas', 'mobile', 'airtel', 'jio'],
      transport: ['uber', 'ola', 'petrol', 'fuel', 'metro', 'taxi'],
      food: ['restaurant', 'food', 'pizza', 'dominos', 'mcdonalds'],
      shopping: ['mart', 'store', 'shopping', 'purchase', 'myntra'],
      emi: ['emi', 'loan', 'insurance', 'premium', 'lic']
    };

    // Count keyword matches
    Object.keys(keywords).forEach(category => {
      features[`${category}_keywords`] = keywords[category].filter(word =>
        text.includes(word)
      ).length;
    });

    // Amount-based features
    features.amount_large = amount > 50000 ? 1 : 0;
    features.amount_medium = amount > 1000 && amount <= 50000 ? 1 : 0;
    features.amount_small = amount <= 1000 ? 1 : 0;
    features.amount_round = amount % 100 === 0 ? 1 : 0;
    features.amount_emi_range = amount > 80000 && amount < 90000 ? 1 : 0;

    // Text pattern features
    features.has_email = text.includes('@') ? 1 : 0;
    features.has_numbers = /\d{10,}/.test(text) ? 1 : 0;
    features.has_refund = text.includes('refund') || text.includes('reversal') ? 1 : 0;
    features.has_dividend = text.includes('div') || text.includes('dividend') ? 1 : 0;
    features.text_length = text.length > 50 ? 1 : 0;
    features.has_company = text.includes('ltd') || text.includes('limited') ? 1 : 0;

    return features;
  };

  // Calculate text similarity (simple Jaccard similarity)
  const calculateSimilarity = (text1, text2) => {
    const words1 = new Set(text1.toLowerCase().split(/\W+/));
    const words2 = new Set(text2.toLowerCase().split(/\W+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  };

  // Check learned patterns from user corrections
  const checkLearnedPatterns = (narration, amount) => {
    if (learningData.length === 0) return null;

    // Find similar transactions that user has corrected
    const similarTransactions = learningData.filter(item => {
      const similarity = calculateSimilarity(narration, item.narration);
      const amountSimilar = Math.abs(amount - item.amount) < (amount * 0.1); // 10% tolerance

      // Multiple matching strategies
      const exactKeywordMatch = item.narration.toLowerCase().split(' ').some(word =>
        word.length > 3 && narration.toLowerCase().includes(word)
      );

      return similarity > 0.7 || amountSimilar || exactKeywordMatch;
    });

    if (similarTransactions.length > 0) {
      // Return the most common correction for similar transactions
      const categoryCount = {};
      similarTransactions.forEach(item => {
        categoryCount[item.correctCategory] = (categoryCount[item.correctCategory] || 0) + 1;
      });

      const mostCommon = Object.keys(categoryCount).reduce((a, b) =>
        categoryCount[a] > categoryCount[b] ? a : b
      );

      // Log the learning match for transparency
      console.log(`🧠 AI Learning Applied: Found ${similarTransactions.length} similar transactions, predicting "${mostCommon}"`);

      return mostCommon;
    }

    return null;
  };

  // ML-like scoring system
  const mlCategorization = (narration, amount) => {
    const features = extractFeatures(narration, amount);
    const scores = {};

    // Initialize scores
    categories.forEach(cat => scores[cat] = 0);

    // Apply learned patterns first
    const learnedCategory = checkLearnedPatterns(narration, amount);
    if (learnedCategory) {
      return learnedCategory;
    }

    // Rule-based scoring with feature weights
    const desc = narration.toLowerCase();

    // Stock Dividend Income
    if (desc.includes('ach c-') || features.has_dividend ||
        (desc.includes('upi-') && desc.includes('div'))) {
      scores['Stock Dividend Income'] += 10;
    }

    // Salary
    if (desc.includes('neft cr-') && desc.includes('phonepe lending services')) {
      scores['Salary'] += 10;
    }

    // Saving Interest
    if (desc.includes('interest paid till')) {
      scores['Saving Interest'] += 10;
    }

    // Loan EMI
    if ((desc.includes('ach d- hdfc bank ltd') && features.amount_large) ||
        (desc.includes('upi-hdfc bank ltd housin')) || features.amount_emi_range) {
      scores['Loan EMI'] += 10;
    }

    // Life Insurance EMI
    if ((desc.includes('lic') && desc.includes('premium')) || desc.includes('hlic inst')) {
      scores['Life Insurance EMI'] += 10;
    }

    // Mutual Fund SIP
    if ((desc.includes('ach d-') && desc.includes('indian clearing corp')) ||
        desc.includes('zerodha coin') || desc.includes('upi-indianclearingcorpor')) {
      scores['Mutual Fund SIP'] += 10;
    }

    // Stock Market Transfer
    if (((desc.includes('zerodha') && !desc.includes('coin')) || desc.includes('groww') ||
         desc.includes('upstox')) && !features.has_refund) {
      scores['Stock Market Transfer'] += 10;
    }

    // Stock Market Transfer Refund
    if (((desc.includes('zerodha') || desc.includes('groww')) && features.has_refund) ||
        (desc.includes('neft cr-') && desc.includes('zerodha broking ltd'))) {
      scores['Stock Market Transfer Refund'] += 10;
    }

    // Food & Dining
    if (features.food_keywords > 0 || desc.includes('swiggy') || desc.includes('zomato') ||
        desc.includes('blinkit') || desc.includes('restaurant')) {
      scores['Food & Dining'] += 8;
    }

    // Entertainment
    if (desc.includes('netflix') || desc.includes('bigtree') || desc.includes('bookmyshow')) {
      scores['Entertainment'] += 10;
    }

    // Credit Card Payment
    if (desc.includes('cred') || desc.includes('credit card')) {
      scores['Credit Card Payment'] += 10;
    }

    // Shopping
    if (features.shopping_keywords > 0 || desc.includes('amazon') || desc.includes('flipkart')) {
      scores['Shopping'] += 8;
    }

    // Mobile/Internet
    if (features.utilities_keywords > 0 || desc.includes('recharge') || desc.includes('prepaid')) {
      scores['Mobile/Internet'] += 8;
    }

    // Rent
    if (desc.includes('rent') || (features.amount_large && desc.includes('upi') && !desc.includes('cred'))) {
      scores['Rent'] += 8;
    }

    // Refund categories
    if (features.has_refund) {
      if (features.food_keywords > 0) scores['Food Refund'] += 10;
      else if (desc.includes('apple')) scores['Apple Refund'] += 10;
      else scores['Refund'] += 5;
    }

    // Find the category with highest score
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0) {
      const bestCategory = Object.keys(scores).find(cat => scores[cat] === maxScore);
      return bestCategory;
    }

    return 'Other Expenses';
  };

  // Process training file (corrected Excel) to learn from user corrections
  const processTrainingFile = useCallback(async () => {
    if (!trainingFile) return;

    setTraining(true);
    setTrainingSuccess(null);
    setError(null);

    try {
      const data = await trainingFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Find header row and locate category column
      let headerRow = -1;
      let categoryColumnIndex = -1;
      let columnMapping = {};

      for (let i = 0; i < Math.min(50, jsonData.length); i++) {
        if (jsonData[i] && jsonData[i].length > 3) {
          const row = jsonData[i];
          const rowStr = row.join(' ').toLowerCase();

          if (headerRow === -1 && (
            (rowStr.includes('date') && rowStr.includes('narration')) ||
            (rowStr.includes('tran date') && rowStr.includes('particulars')) ||
            (rowStr.includes('date') && rowStr.includes('description'))
          )) {
            headerRow = i;

            // Map columns
            for (let j = 0; j < row.length; j++) {
              const header = (row[j] || '').toString().toLowerCase();

              if (header.includes('date') || header.includes('dt')) {
                columnMapping.date = j;
              } else if (header.includes('narration') || header.includes('description') ||
                         header.includes('particulars') || header.includes('details')) {
                columnMapping.description = j;
              } else if (header.includes('withdrawal') || header.includes('debit') || header.includes('dr')) {
                columnMapping.withdrawal = j;
              } else if (header.includes('deposit') || header.includes('credit') || header.includes('cr')) {
                columnMapping.deposit = j;
              } else if (header.includes('category') || header.includes('ai category') || header.includes('transaction category')) {
                categoryColumnIndex = j;
              }
            }
            break;
          }
        }
      }

      if (headerRow === -1 || categoryColumnIndex === -1) {
        throw new Error('Could not find header row or category column in the training file. Please ensure your Excel has a "Transaction Category" column.');
      }

      // Extract learning examples from corrected data
      const newLearningExamples = [];
      let processedCount = 0;

      for (let i = headerRow + 1; i < jsonData.length; i++) {
        if (jsonData[i] && jsonData[i].length > Math.max(columnMapping.description || 0, categoryColumnIndex)) {
          const row = jsonData[i];

          const description = row[columnMapping.description] || '';
          const category = row[categoryColumnIndex] || '';

          let amount = 0;
          if (columnMapping.withdrawal !== undefined && columnMapping.deposit !== undefined) {
            const drStr = (row[columnMapping.withdrawal] || '').toString().trim();
            const crStr = (row[columnMapping.deposit] || '').toString().trim();

            const withdrawalAmount = drStr && drStr !== '' && drStr !== ' ' ? parseFloat(drStr.replace(/,/g, '')) || 0 : 0;
            const depositAmount = crStr && crStr !== '' && crStr !== ' ' ? parseFloat(crStr.replace(/,/g, '')) || 0 : 0;
            amount = withdrawalAmount > 0 ? withdrawalAmount : depositAmount;
          }

          if (description && category && amount > 0 && categories.includes(category)) {
            // Generate what AI would have predicted vs user's correction
            const aiPrediction = mlCategorization(description, amount);

            // Only learn from corrections (when AI prediction differs from Excel category)
            if (aiPrediction !== category) {
              // This is a correction - add to learning data
              newLearningExamples.push({
                narration: description,
                amount: amount,
                originalCategory: aiPrediction,
                correctCategory: category,
                timestamp: Date.now(),
                features: extractFeatures(description, amount),
                source: 'excel_training'
              });
            }
            processedCount++;
          }
        }
      }

      // Add new learning examples to existing data
      const updatedLearningData = [...learningData, ...newLearningExamples];
      setLearningData(updatedLearningData);
      saveLearningData(updatedLearningData);

      setTrainingSuccess({
        totalProcessed: processedCount,
        newLearningExamples: newLearningExamples.length,
        totalLearningData: updatedLearningData.length
      });

      console.log(`Training complete: ${newLearningExamples.length} new corrections learned from ${processedCount} transactions`);

    } catch (err) {
      setError(`Error processing training file: ${err.message}`);
    } finally {
      setTraining(false);
    }
  }, [trainingFile, learningData, categories]);

  const handleTrainingFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setTrainingFile(uploadedFile);
      setTrainingSuccess(null);
      setError(null);
    }
  };

  // Process file with ML categorization
  const processFile = useCallback(async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Generic header detection
      let headerRow = -1;
      let columnMapping = {};

      for (let i = 0; i < Math.min(50, jsonData.length); i++) {
        if (jsonData[i] && jsonData[i].length > 3) {
          const row = jsonData[i];
          const rowStr = row.join(' ').toLowerCase();

          if (headerRow === -1 && (
            (rowStr.includes('date') && rowStr.includes('narration') && (rowStr.includes('withdrawal') || rowStr.includes('debit'))) ||
            (rowStr.includes('tran date') && rowStr.includes('particulars') && rowStr.includes('dr') && rowStr.includes('cr')) ||
            (rowStr.includes('date') && rowStr.includes('description') && (rowStr.includes('amount') || rowStr.includes('debit') || rowStr.includes('credit')))
          )) {
            headerRow = i;

            for (let j = 0; j < row.length; j++) {
              const header = (row[j] || '').toString().toLowerCase();

              if (header.includes('date') || header.includes('dt')) {
                columnMapping.date = j;
              } else if (header.includes('narration') || header.includes('description') ||
                         header.includes('particulars') || header.includes('details')) {
                columnMapping.description = j;
              } else if (header.includes('withdrawal') || header.includes('debit') || header.includes('dr')) {
                columnMapping.withdrawal = j;
              } else if (header.includes('deposit') || header.includes('credit') || header.includes('cr')) {
                columnMapping.deposit = j;
              } else if (header.includes('balance') || header.includes('bal')) {
                columnMapping.balance = j;
              }
            }
            break;
          }
        }
      }

      if (headerRow === -1) {
        throw new Error('Could not find header row in the statement.');
      }

      // Process transactions with ML categorization
      const enhancedData = [];
      const headers = [...jsonData[headerRow], 'AI Category'];
      enhancedData.push(headers);

      let withdrawalCount = 0;
      let depositCount = 0;
      const categoryStats = {};
      const withdrawalDetails = [];

      for (let i = headerRow + 1; i < jsonData.length; i++) {
        if (jsonData[i] && jsonData[i].length > Math.max(columnMapping.date || 0, columnMapping.description || 0)) {
          const row = [...jsonData[i]];

          const date = row[columnMapping.date];
          const description = row[columnMapping.description] || '';

          let withdrawalAmount = 0;
          let depositAmount = 0;

          if (columnMapping.withdrawal !== undefined && columnMapping.deposit !== undefined) {
            const drStr = (row[columnMapping.withdrawal] || '').toString().trim();
            const crStr = (row[columnMapping.deposit] || '').toString().trim();

            withdrawalAmount = drStr && drStr !== '' && drStr !== ' ' ? parseFloat(drStr.replace(/,/g, '')) || 0 : 0;
            depositAmount = crStr && crStr !== '' && crStr !== ' ' ? parseFloat(crStr.replace(/,/g, '')) || 0 : 0;
          }

          if (date && description && (withdrawalAmount > 0 || depositAmount > 0)) {
            const amount = withdrawalAmount > 0 ? withdrawalAmount : depositAmount;
            const category = mlCategorization(description, amount);

            if (withdrawalAmount > 0) withdrawalCount++;
            if (depositAmount > 0 && ['Stock Dividend Income', 'Salary', 'Saving Interest'].includes(category)) {
              depositCount++;
            }

            categoryStats[category] = (categoryStats[category] || 0) + 1;
            withdrawalDetails.push({
              date,
              narration: description,
              amount,
              category,
              type: withdrawalAmount > 0 ? 'withdrawal' : 'deposit'
            });

            row.push(category);
          } else {
            row.push('');
          }

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
        headers,
        columnMapping
      });

    } catch (err) {
      setError(`Error processing file: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  }, [file, learningData]);

  const copyTableData = () => {
    if (!categorizedData) return;

    const csvContent = categorizedData.map(row =>
      row.map(cell => `"${cell || ''}"`).join(',')
    ).join('\n');

    navigator.clipboard.writeText(csvContent).then(() => {
      alert('AI categorized data copied to clipboard! You can paste it into Excel.');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = csvContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('AI categorized data copied to clipboard! You can paste it into Excel.');
    });
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setResults(null);
      setError(null);
      setShowTable(false);
      setTrainingSuccess(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          AI-Powered Bank Statement Categorizer
        </h1>
        <p className="text-gray-600">
          Upload your Excel bank statement for intelligent categorization that learns from your corrections.
        </p>
        <div className="mt-2 flex items-center gap-4">
          <span className={`text-sm px-2 py-1 rounded ${learningData.length > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            AI Model: {learningData.length > 10 ? 'Well Trained' : 'Learning Mode'}
          </span>
          <span className="text-sm text-gray-600">
            Learning Examples: {learningData.length}
          </span>
          <span className="text-sm text-gray-600">
            Accuracy: {modelAccuracy}%
          </span>
        </div>
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
          {processing ? 'AI Processing...' : 'Categorize with AI'}
        </button>
      </div>

      {/* Training Section */}
      <div className="bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg p-8 text-center mb-6">
        <Brain className="mx-auto h-12 w-12 text-purple-400 mb-4" />
        <h3 className="text-lg font-semibold text-purple-800 mb-2">Train AI with Corrected Data</h3>
        <p className="text-purple-600 text-sm mb-4">
          Upload an Excel file with corrected categories to teach the AI your preferences
        </p>
        <div className="mb-4">
          <label htmlFor="training-file-upload" className="cursor-pointer">
            <span className="text-purple-600 hover:text-purple-500 font-medium">
              Click to upload corrected Excel file
            </span>
            <input
              id="training-file-upload"
              type="file"
              accept=".xls,.xlsx"
              onChange={handleTrainingFileUpload}
              className="hidden"
            />
          </label>
        </div>
        {trainingFile && (
          <div className="text-sm text-gray-600 mb-4">
            Training File: {trainingFile.name} ({(trainingFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
        <button
          onClick={processTrainingFile}
          disabled={!trainingFile || training}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {training ? 'Learning...' : 'Train AI Model'}
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

      {trainingSuccess && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <span className="text-purple-800 font-medium">Training Complete!</span>
              <div className="text-sm text-purple-600 mt-1">
                Processed {trainingSuccess.totalProcessed} transactions, learned {trainingSuccess.newLearningExamples} new corrections.
                Total learning examples: {trainingSuccess.totalLearningData}
              </div>
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-green-800">AI Processing Complete!</h2>
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
              <div className="text-sm text-gray-600">AI Categories</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">AI Category Breakdown:</h3>
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
              {showTable ? 'Hide' : 'View'} AI Results
            </button>

            <button
              onClick={copyTableData}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy AI Data
            </button>

            <button
              onClick={() => setShowLearning(!showLearning)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              Learning History ({learningData.length})
            </button>
          </div>

          {showTable && categorizedData && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">AI Categorized Transaction Data:</h3>
              <p className="text-sm text-gray-600 mb-3">
                💡 Copy this data to Excel, correct any wrong categories, then upload the corrected file to train the AI!
              </p>
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

          {showLearning && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">AI Learning History:</h3>
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Description</th>
                        <th className="px-3 py-2 text-left font-medium">Amount</th>
                        <th className="px-3 py-2 text-left font-medium">AI Predicted</th>
                        <th className="px-3 py-2 text-left font-medium">Your Correction</th>
                        <th className="px-3 py-2 text-left font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {learningData.slice(-20).reverse().map((example, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 border-b max-w-xs truncate" title={example.narration}>
                            {example.narration}
                          </td>
                          <td className="px-3 py-2 border-b">₹{example.amount}</td>
                          <td className="px-3 py-2 border-b">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                              {example.originalCategory}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-b">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              {example.correctCategory}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-b">
                            {new Date(example.timestamp).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {learningData.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No learning examples yet. Correct some categories to teach the AI!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">How AI Learning Works:</h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-2">
          <li>Upload your bank statement and let AI categorize transactions</li>
          <li><strong>Correct wrong categories</strong> by clicking dropdown in the table</li>
          <li>AI learns from your corrections and improves future predictions</li>
          <li>Copy the corrected data to Excel when satisfied</li>
        </ol>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">AI Features:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-blue-700 mb-1">Machine Learning:</div>
            <ul className="list-disc list-inside text-blue-600 space-y-1">
              <li><strong>Feature Engineering:</strong> 20+ smart features from transaction text</li>
              <li><strong>Pattern Recognition:</strong> Learns your specific spending patterns</li>
              <li><strong>Similarity Matching:</strong> Finds similar transactions you've corrected</li>
              <li><strong>Continuous Learning:</strong> Improves with every correction you make</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-blue-700 mb-1">Smart Categories:</div>
            <ul className="list-disc list-inside text-blue-600 space-y-1">
              <li><strong>Income:</strong> Salary, dividends, interest, transfers</li>
              <li><strong>Investments:</strong> SIPs, stock transfers, refunds</li>
              <li><strong>Expenses:</strong> Food, rent, shopping, entertainment</li>
              <li><strong>Loans:</strong> EMIs, insurance premiums</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white rounded border">
          <div className="font-medium text-blue-700 mb-2">🧠 AI Model Status:</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Model:</span> {learningData.length > 10 ? 'Well Trained' : 'Learning Mode'}
            </div>
            <div>
              <span className="font-medium">Learning Examples:</span> {learningData.length}
            </div>
            <div>
              <span className="font-medium">Accuracy:</span> {modelAccuracy}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLBankStatementCategorizer;