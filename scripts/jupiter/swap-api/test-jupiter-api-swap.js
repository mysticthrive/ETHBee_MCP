const axios = require('axios');
const { Keypair, Transaction, VersionedTransaction } = require('@solana/web3.js');
const { signTransaction, sendSignedTransaction } = require('../../../lib/utils/solana-utils.js');

const testWallet = Keypair.generate();

// Configuration
const QUOTE_API_URL = 'http://localhost:3000/api/trade/jupiter/swap-api/quote';
const SWAP_API_URL = 'http://localhost:3000/api/trade/jupiter/swap-api/swap';
const SIMULATE_API_URL = 'http://localhost:3000/api/trade/solana/simulate-transaction';
const SEND_API_URL = 'http://localhost:3000/api/trade/solana/send-transaction';

// Common token addresses
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'
};

// Example wallet
const TEST_WALLET = testWallet.publicKey.toString();

// Test cases for quote
const quoteTestCases = [
  {
    name: 'With platform fee',
    params: {
      inputMint: TOKENS.SOL,
      outputMint: TOKENS.USDC,
      amount: '1000000000',
      platformFeeBps: '10', // 0.1%
    }
  }
];

// Test cases for swap (will be populated with quote responses)
const swapTestCases = [
  {
    name: 'Basic swap',
    params: {
      userPublicKey: TEST_WALLET,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          maxLamports: 10000000,
          priorityLevel: "veryHigh"
        }
      },
      dynamicComputeUnitLimit: true
    }
  }
];

// Function to test the quote API
async function testJupiterQuote() {
  console.log('Starting Jupiter Quote API tests...\n');
  const successfulQuotes = [];

  for (const testCase of quoteTestCases) {
    try {
      console.log(`\nTesting Quote: ${testCase.name}`);
      console.log('Parameters:', JSON.stringify(testCase.params, null, 2));

      const response = await axios.post(QUOTE_API_URL, testCase.params);
      
      if (testCase.expectError) {
        console.error('❌ Test failed: Expected error but got success response');
        continue;
      }

      console.log('✅ Quote Response:', JSON.stringify(response.data, null, 2));
      console.log('Status:', response.status);

      // Validate response structure
      if (!response.data.success || !response.data.data) {
        console.error('❌ Invalid response structure');
        continue;
      }

      // Store successful quote for swap testing
      successfulQuotes.push(response.data.data);
      console.log('✅ Quote test passed');
      console.log('----------------------------------------');
    } catch (error) {
      if (testCase.expectError) {
        console.log('✅ Expected error:', error.response?.data?.error || error.message);
      } else {
        console.error('❌ Unexpected error:', error.response?.data?.error || error.message);
      }
      console.log('----------------------------------------');
    }
  }

  return successfulQuotes;
}

// Function to test the swap API
async function testJupiterSwap(quotes) {
  console.log('\nStarting Jupiter Swap API tests...\n');

  const swapResponses = [];

  for (const quote of quotes) {
    for (const testCase of swapTestCases) {
      try {
        console.log(`\nTesting Swap: ${testCase.name}`);
        console.log('Using quote for:', quote.inputMint, 'to', quote.outputMint);
        
        const params = {
          ...testCase.params,
          quoteResponse: quote
        };

        console.log('Parameters:', JSON.stringify(params, null, 2));

        const response = await axios.post(SWAP_API_URL, params);
        
        console.log('✅ Swap Response:', JSON.stringify(response.data, null, 2));
        console.log('Status:', response.status);

        // Validate response structure
        if (!response.data.success || !response.data.data) {
          console.error('❌ Invalid response structure');
          continue;
        }

        console.log('✅ Swap test passed');
        console.log('----------------------------------------');

        swapResponses.push(response);
      } catch (error) {
        console.error('❌ Unexpected error:', error.response?.data?.error || error.message);
        console.log('----------------------------------------');
      }
    }
  }

  return swapResponses;
}

// Function to test the simulate transaction API
async function testSimulateTransaction(swapResponse) {
  console.log('\nStarting Simulate Transaction API tests...\n');

  try {
    console.log('Testing Simulate Transaction with swap response');
    
    const params = {
      transaction: swapResponse.data.swapTransaction,
      config: {
        sigVerify: false,
        replaceRecentBlockhash: true,
        commitment: "finalized",
        innerInstructions: true
      }
    };

    console.log('Parameters:', JSON.stringify(params, null, 2));

    const response = await axios.post(SIMULATE_API_URL, params);
    
    console.log('✅ Simulate Response:', JSON.stringify(response.data, null, 2));
    console.log('Status:', response.status);

    // Validate response structure
    if (!response.data.success || !response.data.data) {
      console.error('❌ Invalid response structure');
      return; 
    }

    console.log('✅ Simulate test passed');
    console.log('----------------------------------------');
  } catch (error) {
    console.error('❌ Unexpected error:', error.response?.data?.error || error.message);
    console.log('----------------------------------------');
  }
}

// Function to test sending a signed transaction
async function testSendTransaction(swapResponse) {
  console.log('\nStarting Send Transaction API tests...\n');

  try {
    console.log('Testing Send Transaction with swap response');
    
    // Create a test wallet (in production, this would be the user's actual wallet)
    console.log("😍testWallet");
    console.log(testWallet);
    
    // Sign the transaction
    const signedTransaction = await signTransaction(
      swapResponse.data.swapTransaction,
      testWallet
    );

    console.log(signedTransaction);

    // Send the signed transaction
    const params = {
      transaction: signedTransaction
    };

    console.log('Parameters:', JSON.stringify(params, null, 2));

    const response = await axios.post(SEND_API_URL, params);
    
    console.log('✅ Send Response:', JSON.stringify(response.data, null, 2));
    console.log('Status:', response.status);

    // Validate response structure
    if (!response.data.success || !response.data.data) {
      console.error('❌ Invalid response structure');
      return;
    }

    console.log('✅ Send test passed');
    console.log('----------------------------------------');
  } catch (error) {
    console.error('❌ Unexpected error:', error.response?.data?.error || error.message);
    console.log('----------------------------------------');
  }
}

// Main test function
async function runTests() {
  try {
    // First run quote tests and collect successful quotes
    const successfulQuotes = await testJupiterQuote();
    
    if (successfulQuotes.length > 0) {
      // Then run swap tests using the successful quotes
      const swapResponses = await testJupiterSwap(successfulQuotes);
      
      // Run simulate transaction tests
      if (swapResponses && swapResponses.length > 0) {
        for (const swapResponse of swapResponses) {
          await testSimulateTransaction(swapResponse.data);
          // Uncomment the following line to test sending transactions
          // await testSendTransaction(swapResponse.data);
        }
      }
    } else {
      console.log('No successful quotes to test swaps with');
    }
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

// Run the tests
runTests().catch(console.error);
