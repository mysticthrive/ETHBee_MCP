/**
 * Example: Get Token Decimals Using getMint
 * 
 * This demonstrates the most reliable way to get token decimals
 * directly from the Solana blockchain using @solana/spl-token
 */

const { getMint } = require("@solana/spl-token");
const { Connection, PublicKey } = require("@solana/web3.js");

// Configuration
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC_URL, {
  commitment: "confirmed"
});

// Example token addresses
const TOKEN_EXAMPLES = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"
};

/**
 * Get token decimals directly from mint account
 * @param {string} tokenAddress - Token mint address
 * @returns {Promise<number|null>} - Token decimals or null if failed
 */
async function getTokenDecimals(tokenAddress) {
  try {
    const inputMintPublicKey = new PublicKey(tokenAddress);
    const inputMintInfo = await getMint(connection, inputMintPublicKey);
    return inputMintInfo.decimals;
  } catch (error) {
    console.error(`Error getting decimals for ${tokenAddress}:`, error.message);
    return null;
  }
}

/**
 * Get comprehensive token mint information
 * @param {string} tokenAddress - Token mint address
 * @returns {Promise<object|null>} - Mint info or null if failed
 */
async function getTokenMintInfo(tokenAddress) {
  try {
    const inputMintPublicKey = new PublicKey(tokenAddress);
    const inputMintInfo = await getMint(connection, inputMintPublicKey);
    
    return {
      decimals: inputMintInfo.decimals,
      supply: inputMintInfo.supply.toString(),
      isInitialized: inputMintInfo.isInitialized,
      freezeAuthority: inputMintInfo.freezeAuthority?.toString() || null,
      mintAuthority: inputMintInfo.mintAuthority?.toString() || null,
    };
  } catch (error) {
    console.error(`Error getting mint info for ${tokenAddress}:`, error.message);
    return null;
  }
}

/**
 * Convert human-readable amount to smallest unit
 * @param {number} amount - Human-readable amount
 * @param {string} tokenAddress - Token mint address
 * @returns {Promise<string|null>} - Amount in smallest unit or null if failed
 */
async function convertToSmallestUnit(amount, tokenAddress) {
  try {
    const decimals = await getTokenDecimals(tokenAddress);
    if (decimals === null) return null;
    
    const smallestUnit = Math.floor(amount * Math.pow(10, decimals));
    return smallestUnit.toString();
  } catch (error) {
    console.error(`Error converting amount for ${tokenAddress}:`, error.message);
    return null;
  }
}

/**
 * Convert smallest unit amount back to human-readable format
 * @param {string} smallestUnit - Amount in smallest unit
 * @param {string} tokenAddress - Token mint address
 * @returns {Promise<number|null>} - Human-readable amount or null if failed
 */
async function convertFromSmallestUnit(smallestUnit, tokenAddress) {
  try {
    const decimals = await getTokenDecimals(tokenAddress);
    if (decimals === null) return null;
    
    const amountNum = parseInt(smallestUnit);
    if (isNaN(amountNum)) {
      throw new Error(`Invalid smallest unit amount: ${smallestUnit}`);
    }
    
    return amountNum / Math.pow(10, decimals);
  } catch (error) {
    console.error(`Error converting from smallest unit for ${tokenAddress}:`, error.message);
    return null;
  }
}

/**
 * Main function to demonstrate the functionality
 */
async function main() {
  console.log("🔍 Token Decimals Example using getMint\n");

  // Test getting decimals for different tokens
  for (const [symbol, address] of Object.entries(TOKEN_EXAMPLES)) {
    console.log(`📊 Getting decimals for ${symbol}...`);
    
    // Get decimals
    const decimals = await getTokenDecimals(address);
    console.log(`   Decimals: ${decimals}`);
    
    // Get full mint info
    const mintInfo = await getTokenMintInfo(address);
    if (mintInfo) {
      console.log(`   Supply: ${mintInfo.supply}`);
      console.log(`   Initialized: ${mintInfo.isInitialized}`);
      console.log(`   Mint Authority: ${mintInfo.mintAuthority || 'None'}`);
      console.log(`   Freeze Authority: ${mintInfo.freezeAuthority || 'None'}`);
    }
    
    // Test conversion
    const testAmount = 1.5;
    const smallestUnit = await convertToSmallestUnit(testAmount, address);
    const convertedBack = await convertFromSmallestUnit(smallestUnit, address);
    
    console.log(`   Test conversion: ${testAmount} → ${smallestUnit} → ${convertedBack}`);
    console.log("");
  }

  // Test with an invalid address
  console.log("❌ Testing with invalid address...");
  const invalidDecimals = await getTokenDecimals("invalid_address");
  console.log(`   Result: ${invalidDecimals}`);
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getTokenDecimals,
  getTokenMintInfo,
  convertToSmallestUnit,
  convertFromSmallestUnit
}; 