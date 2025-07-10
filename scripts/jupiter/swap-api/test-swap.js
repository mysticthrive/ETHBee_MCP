const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000/api/trade/jupiter/swap-api/swap';

// Example wallet and token addresses
const TEST_WALLET = '8kTpmtiumG3VFQmgFBUgVjkt62jKFKM5oWKLLjaPJtQq';
const FEE_ACCOUNT = '8kTpmtiumG3VFQmgFBUgVjkt62jKFKM5oWKLLjaPJtQq';

// Mock quote response (you should get this from a real /quote call)
const mockQuoteResponse = {
  "inputMint": "So11111111111111111111111111111111111111112",        
    "inAmount": "1000000000",
    "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",      
    "outAmount": "155230811",
    "otherAmountThreshold": "154454657",
    "swapMode": "ExactIn",
    "slippageBps": 50,
    "platformFee": null,
    "priceImpactPct": "0",
    "routePlan": [
      {
        "swapInfo": {
          "ammKey": "AvBSC1KmFNceHpD6jyyXBV6gMXFxZ8BJJ3HVUN8kCurJ",    
          "label": "Obric V2",
          "inputMint": "So11111111111111111111111111111111111111112",  
          "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "inAmount": "1000000000",
          "outAmount": "155230811",
          "feeAmount": "8538",
          "feeMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"    
        },
        "percent": 100
      }
    ],
    "contextSlot": 343649049,
    "timeTaken": 0.001824422,
    "swapUsdValue": "155.16696850262603025824159267",
    "simplerRouteUsed": false,
    "mostReliableAmmsQuoteReport": {
      "info": {
        "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE": "155135713",
        "BZtgQEyS6eXUXicYPHecYQ7PybqodXQMvkjUbP4R8mUU": "154493989"
      }
    },
    "useIncurredSlippageForQuoting": null,
    "otherRoutePlans": null,
    "timestamp": "2025-05-31T08:55:12.805Z",
    "requestParams": {
      "inputMint": "So11111111111111111111111111111111111111112",
      "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "amount": "1000000000",
      "slippageBps": "50",
      "swapMode": "ExactIn"
    }
};

// Test cases
const testCases = [
  {
    name: 'Basic swap',
    params: {
      userPublicKey: TEST_WALLET,
      route: mockQuoteResponse,
      wrapAndUnwrapSol: true
    }
  },
  {
    name: 'With platform fee',
    params: {
      userPublicKey: TEST_WALLET,
      route: mockQuoteResponse,
      platformFee: {
        feeBps: 5, // 0.05%
        feeAccount: FEE_ACCOUNT
      }
    }
  },
  {
    name: 'With compute unit price',
    params: {
      userPublicKey: TEST_WALLET,
      route: mockQuoteResponse,
      computeUnitPriceMicroLamports: 5000
    }
  },
  {
    name: 'Legacy transaction',
    params: {
      userPublicKey: TEST_WALLET,
      route: mockQuoteResponse,
      asLegacyTransaction: true
    }
  },
  {
    name: 'Missing required fields',
    params: {
      userPublicKey: TEST_WALLET,
      // Missing route
    },
    expectError: true
  },
  {
    name: 'Invalid platform fee',
    params: {
      userPublicKey: TEST_WALLET,
      route: mockQuoteResponse,
      platformFee: {
        // Missing feeBps
        feeAccount: FEE_ACCOUNT
      }
    },
    expectError: true
  }
];

// Function to test the API
async function testJupiterSwap() {
  console.log('Starting Jupiter Swap API tests...\n');

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

      // Validate swap data
      const swapData = response.data.data;
      if (!swapData.swapTransaction || !swapData.lastValidBlockHeight) {
        console.error('❌ Missing required swap data fields');
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
testJupiterSwap().catch(console.error);
