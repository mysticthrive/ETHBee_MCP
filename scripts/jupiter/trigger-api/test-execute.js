const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000/api/trade/jupiter/trigger-api/execute';

// Example data (these would come from create-order response in real usage)
const EXAMPLE_DATA = {
  VALID_REQUEST: {
    requestId: "example-request-id-123",
    signedTransaction: "example-signed-transaction-base64-string"
  },
  INVALID_REQUEST: {
    requestId: "invalid-request-id",
    signedTransaction: "invalid-transaction"
  }
};

// Test cases
const testCases = [
  {
    name: 'Valid execute request',
    params: {
      requestId: EXAMPLE_DATA.VALID_REQUEST.requestId,
      signedTransaction: EXAMPLE_DATA.VALID_REQUEST.signedTransaction
    }
  },
  {
    name: 'Missing requestId',
    params: {
      signedTransaction: EXAMPLE_DATA.VALID_REQUEST.signedTransaction
    },
    expectError: true
  },
  {
    name: 'Missing signedTransaction',
    params: {
      requestId: EXAMPLE_DATA.VALID_REQUEST.requestId
    },
    expectError: true
  },
  {
    name: 'Invalid request data',
    params: {
      requestId: EXAMPLE_DATA.INVALID_REQUEST.requestId,
      signedTransaction: EXAMPLE_DATA.INVALID_REQUEST.signedTransaction
    },
    expectError: true
  }
];

// Function to test the API
async function testExecute() {
  console.log('Starting Jupiter Execute API tests...\n');

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
testExecute().catch(console.error);
