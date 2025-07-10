const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000/api/trade/jupiter/trigger-api/create-order';

// Common token addresses
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'
};

// Example wallet addresses
const WALLETS = {
  MAKER: 'jdocuPgEAjMfihABsPgKEvYtsmMzjUHeq9LX4Hvs7f3',
  PAYER: 'jdocuPgEAjMfihABsPgKEvYtsmMzjUHeq9LX4Hvs7f3',
  FEE_ACCOUNT: 'jdocuPgEAjMfihABsPgKEvYtsmMzjUHeq9LX4Hvs7f3'
};

// Helper function to get unix timestamp in seconds
const getUnixTimestamp = (hoursFromNow = 24) => {
  return Math.floor((Date.now() + hoursFromNow * 60 * 60 * 1000) / 1000).toString();
};

// Test cases
const testCases = [
  {
    name: 'Basic USDC to SOL order',
    params: {
      maker: WALLETS.MAKER,
      payer: WALLETS.PAYER,
      inputMint: TOKENS.USDC,
      outputMint: TOKENS.SOL,
      params: {
        makingAmount: '100000000', // 100 USDC
        takingAmount: '500000000000',  // 0.05 SOL
        expiredAt: getUnixTimestamp(24) // 24 hours from now in unix seconds
      },
      computeUnitPrice: 'auto'
      // wrapAndUnwrapSol is optional, defaults to true
    }
  },
  {
    name: 'Order with fee account and slippage',
    params: {
      maker: WALLETS.MAKER,
      payer: WALLETS.PAYER,
      inputMint: TOKENS.SOL,
      outputMint: TOKENS.USDC,
      params: {
        makingAmount: '1000000000', // 1 SOL
        takingAmount: '200000000000',   // 20 USDC
        expiredAt: getUnixTimestamp(12), // 12 hours from now
        slippageBps: '0', // Optional, trigger orders execute with 0 slippage
        feeBps: '10' // 0.1% fee
      },
      feeAccount: WALLETS.FEE_ACCOUNT, // Referral token account
      computeUnitPrice: 'auto',
      wrapAndUnwrapSol: true
    }
  },
  {
    name: 'Order with custom compute unit price and no SOL wrapping',
    params: {
      maker: WALLETS.MAKER,
      payer: WALLETS.PAYER,
      inputMint: TOKENS.USDC,
      outputMint: TOKENS.BONK,
      params: {
        makingAmount: '5000000', // 1 USDC
        takingAmount: '1000000000000', // 1 BONK
        expiredAt: getUnixTimestamp(6) // 6 hours from now
      },
      computeUnitPrice: '1000',
      wrapAndUnwrapSol: false // Explicitly disable SOL wrapping
    }
  },
  {
    name: 'Order without expiration',
    params: {
      maker: WALLETS.MAKER,
      payer: WALLETS.PAYER,
      inputMint: TOKENS.USDC,
      outputMint: TOKENS.JUP,
      params: {
        makingAmount: '5000000', // 1 USDC
        takingAmount: '100000000'  // 1 JUP
        // expiredAt is optional
      },
      computeUnitPrice: 'auto'
    }
  },
  {
    name: 'Missing required fields',
    params: {
      maker: WALLETS.MAKER,
      // Missing payer, inputMint, outputMint, and params
    },
    expectError: true
  },
  {
    name: 'Invalid params structure',
    params: {
      maker: WALLETS.MAKER,
      payer: WALLETS.PAYER,
      inputMint: TOKENS.USDC,
      outputMint: TOKENS.SOL,
      params: {
        // Missing required makingAmount and takingAmount
        expiredAt: getUnixTimestamp(1)
      }
    },
    expectError: true
  }
];

// Function to test the API
async function testCreateOrder() {
  console.log('Starting Jupiter Create Order API tests...\n');

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
testCreateOrder().catch(console.error);
