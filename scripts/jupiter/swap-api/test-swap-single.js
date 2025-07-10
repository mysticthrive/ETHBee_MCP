const axios = require('axios');

// Configuration
const SWAP_API_URL = 'http://localhost:3000/api/trade/jupiter/swap-api/swap';

// Test payload
const testPayload = {
  userPublicKey: "jdocuPgEAjMfihABsPgKEvYtsmMzjUHeq9LX4Hvs7f3",
  quoteResponse: {
    inputMint: "So11111111111111111111111111111111111111112",
    inAmount: "1000000",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    outAmount: "125630",
    otherAmountThreshold: "125002",
    swapMode: "ExactIn",
    slippageBps: 50,
    platformFee: null,
    priceImpactPct: "0",
    routePlan: [
      {
        swapInfo: {
          ammKey: "AvBSC1KmFNceHpD6jyyXBV6gMXFxZ8BJJ3HVUN8kCurJ",
          label: "Obric V2",
          inputMint: "So11111111111111111111111111111111111111112",
          outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          inAmount: "1000000",
          outAmount: "125630",
          feeAmount: "5",
          feeMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        },
        percent: 100
      }
    ]
  },
  prioritizationFeeLamports: {
    priorityLevelWithMaxLamports: {
      maxLamports: 10000000,
      priorityLevel: "veryHigh"
    }
  },
  dynamicComputeUnitLimit: true
};

// Function to test the swap API
async function testJupiterSwap() {
  console.log('Starting Jupiter Swap API test...\n');
  
  try {
    console.log('Testing Swap with provided payload');
    console.log('Parameters:', JSON.stringify(testPayload, null, 2));

    const response = await axios.post(SWAP_API_URL, testPayload);
    
    console.log('✅ Swap Response:', JSON.stringify(response.data, null, 2));
    console.log('Status:', response.status);

    // Validate response structure
    if (!response.data.success || !response.data.data) {
      console.error('❌ Invalid response structure');
      return;
    }

    // Validate swap data
    const swapData = response.data.data;
    if (!swapData.swapTransaction || !swapData.lastValidBlockHeight) {
      console.error('❌ Missing required swap data fields');
      return;
    }

    console.log('✅ Swap test passed');
    console.log('----------------------------------------');
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    console.log('----------------------------------------');
  }
}

// Run the test
testJupiterSwap().catch(console.error);
