const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000/api/trade/jupiter/swap-api/quote';

// Common token addresses
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'
};

// Test cases
const testCases = [
  {
    name: 'Basic SOL to USDC swap',
    params: {
      inputMint: TOKENS.SOL,
      outputMint: TOKENS.USDC,
      amount: '1000000000', // 1 SOL
      slippageBps: '50', // 0.5%
    }
  },
  {
    name: 'ExactOut swap mode',
    params: {
      inputMint: TOKENS.SOL,
      outputMint: TOKENS.USDC,
      amount: '1000000', // 1 USDC
      slippageBps: '100', // 1%
      swapMode: 'ExactOut'
    }
  },
  {
    name: 'With platform fee',
    params: {
      inputMint: TOKENS.SOL,
      outputMint: TOKENS.USDC,
      amount: '1000000000',
      platformFeeBps: '10', // 0.1%
    }
  },
  {
    name: 'Invalid swap mode',
    params: {
      inputMint: TOKENS.SOL,
      outputMint: TOKENS.USDC,
      amount: '1000000000',
      swapMode: 'InvalidMode'
    },
    expectError: true
  },
  {
    name: 'Missing required fields',
    params: {
      inputMint: TOKENS.SOL,
      // Missing outputMint and amount
    },
    expectError: true
  }
];

// Function to test the API
async function testJupiterQuote() {
  console.log('Starting Jupiter Quote API tests...\n');

  for (const testCase of testCases) {
    try {
      console.log(`\nTesting: ${testCase.name}`);
      console.log('Parameters:', JSON.stringify(testCase.params, null, 2));

      const response = await axios.post(API_URL, testCase.params);
      
      if (testCase.expectError) {
        console.error('❌ Test failed: Expected error but got success response');
        continue;
      }

      console.log('✅ Response:', JSON.stringify(response.data, null, 2));
      console.log('Status:', response.status);

      // Validate response structure
      if (!response.data.success || !response.data.data) {
        console.error('❌ Invalid response structure');
        continue;
      }

      console.log('✅ Test passed');
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
}

// Run the tests
testJupiterQuote().catch(console.error);
