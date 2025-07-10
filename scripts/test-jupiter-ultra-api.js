// Test script for Jupiter Ultra API endpoint
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000/api/trade/jupiter/ultra-api/order'; // Adjust port if needed

// Test cases
const testCases = [
  {
    name: 'Basic SOL to USDC swap',
    params: {
      inputMint: 'So11111111111111111111111111111111111111112', // SOL
      outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      amount: '1000000000', // 1 SOL (in lamports)
      slippageBps: 50, // 0.5%
    }
  },
  {
    name: 'Direct route only',
    params: {
      inputMint: 'So11111111111111111111111111111111111111112', // SOL
      outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      amount: '1000000000', // 1 SOL
      onlyDirectRoutes: true,
    }
  },
  {
    name: 'Legacy transaction',
    params: {
      inputMint: 'So11111111111111111111111111111111111111112', // SOL
      outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      amount: '1000000000', // 1 SOL
      asLegacyTransaction: true,
    }
  }
];

// Function to test the API
async function testJupiterUltraAPI() {
  console.log('Starting Jupiter Ultra API tests...\n');

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log('Parameters:', JSON.stringify(testCase.params, null, 2));

      const response = await axios.post(API_URL, testCase.params);
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      console.log('Status:', response.status);
      console.log('----------------------------------------\n');
    } catch (error) {
      console.error(`Error in test case "${testCase.name}":`);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      } else {
        console.error('Error:', error.message);
      }
      console.log('----------------------------------------\n');
    }
  }
}

// Run the tests
testJupiterUltraAPI().catch(console.error);
