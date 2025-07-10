'use client'

import React, { useState, useEffect } from 'react'
import { TokenSearch, TokenSearchInput } from '@/components/token-search'
import { useTokenAddress, useTokenInfo } from '@/hooks/use-token-lookup'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { getTokenDecimalsDirect, getTokenMintInfo } from '@/lib/utils/token-utils'

export default function TokenSearchDemo() {
    const [selectedToken, setSelectedToken] = useState<any>(null)
    const [symbolInput, setSymbolInput] = useState('')
    const [addressInput, setAddressInput] = useState('')

    // Hook for getting token address from symbol
    const { address, isLoading: addressLoading, error: addressError } = useTokenAddress(symbolInput)

    // Hook for getting token info from symbol
    const { tokenInfo, isLoading: infoLoading, error: infoError } = useTokenInfo(symbolInput)

    return (
        <div className="space-y-8 mx-auto py-8 container">
            <div className="text-center">
                <h1 className="mb-2 font-bold text-3xl">Token Search Demo</h1>
                <p className="text-gray-600">
                    Dynamic token lookup using Jupiter API and Solana Token List
                </p>
            </div>

            {/* Full Token Search Component */}
            <Card>
                <CardHeader>
                    <CardTitle>Full Token Search</CardTitle>
                </CardHeader>
                <CardContent>
                    <TokenSearch
                        onTokenSelect={setSelectedToken}
                        includeUnverified={true}
                        maxResults={10}
                        showAdvancedOptions={true}
                    />
                </CardContent>
            </Card>

            {/* Selected Token Display */}
            {selectedToken && (
                <Card>
                    <CardHeader>
                        <CardTitle>Selected Token</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                {selectedToken.logoUrl ? (
                                    <img
                                        src={selectedToken.logoUrl}
                                        alt={selectedToken.symbol}
                                        className="rounded-full w-12 h-12"
                                    />
                                ) : (
                                    <div className="flex justify-center items-center bg-gray-200 rounded-full w-12 h-12">
                                        <span className="font-medium text-gray-500 text-lg">
                                            {selectedToken.symbol.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-bold text-xl">{selectedToken.symbol}</h3>
                                        {selectedToken.verified && (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        )}
                                    </div>
                                    <p className="text-gray-600">{selectedToken.name}</p>
                                </div>
                            </div>

                            <div className="gap-4 grid grid-cols-2 text-sm">
                                <div>
                                    <Label>Address</Label>
                                    <p className="font-mono text-xs break-all">{selectedToken.address}</p>
                                </div>
                                <div>
                                    <Label>Decimals</Label>
                                    <p>{selectedToken.decimals}</p>
                                </div>
                                <div>
                                    <Label>Source</Label>
                                    <Badge variant="secondary">{selectedToken.source}</Badge>
                                </div>
                                <div>
                                    <Label>Verified</Label>
                                    <p>{selectedToken.verified ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Simple Token Search Input */}
            <Card>
                <CardHeader>
                    <CardTitle>Simple Token Search Input</CardTitle>
                </CardHeader>
                <CardContent>
                    <TokenSearchInput
                        onTokenSelect={setSelectedToken}
                        placeholder="Search for a token..."
                    />
                </CardContent>
            </Card>

            {/* Token Address Lookup */}
            <Card>
                <CardHeader>
                    <CardTitle>Get Token Address from Symbol</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="symbol-input">Token Symbol</Label>
                        <Input
                            id="symbol-input"
                            placeholder="Enter token symbol (e.g., SOL, BONK)"
                            value={symbolInput}
                            onChange={(e) => setSymbolInput(e.target.value)}
                        />
                    </div>

                    {addressLoading && (
                        <div className="flex items-center space-x-2 text-blue-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading token address...</span>
                        </div>
                    )}

                    {addressError && (
                        <div className="flex items-center space-x-2 text-red-500">
                            <AlertCircle className="w-4 h-4" />
                            <span>{addressError}</span>
                        </div>
                    )}

                    {address && (
                        <div className="bg-green-50 p-4 border border-green-200 rounded-md">
                            <Label className="text-green-800">Token Address</Label>
                            <p className="font-mono text-green-700 text-sm break-all">{address}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Token Info Lookup */}
            <Card>
                <CardHeader>
                    <CardTitle>Get Token Info from Symbol</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {infoLoading && (
                        <div className="flex items-center space-x-2 text-blue-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading token info...</span>
                        </div>
                    )}

                    {infoError && (
                        <div className="flex items-center space-x-2 text-red-500">
                            <AlertCircle className="w-4 h-4" />
                            <span>{infoError}</span>
                        </div>
                    )}

                    {tokenInfo && (
                        <div className="bg-blue-50 p-4 border border-blue-200 rounded-md">
                            <div className="flex items-center space-x-3 mb-3">
                                {tokenInfo.logoUrl ? (
                                    <img
                                        src={tokenInfo.logoUrl}
                                        alt={tokenInfo.symbol}
                                        className="rounded-full w-8 h-8"
                                    />
                                ) : (
                                    <div className="flex justify-center items-center bg-gray-200 rounded-full w-8 h-8">
                                        <span className="font-medium text-gray-500 text-xs">
                                            {tokenInfo.symbol.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-bold">{tokenInfo.symbol}</h4>
                                        {tokenInfo.verified && (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-sm">{tokenInfo.name}</p>
                                </div>
                            </div>

                            <div className="gap-2 grid grid-cols-2 text-sm">
                                <div>
                                    <Label className="text-blue-800">Address</Label>
                                    <p className="font-mono text-blue-700 text-xs break-all">{tokenInfo.address}</p>
                                </div>
                                <div>
                                    <Label className="text-blue-800">Decimals</Label>
                                    <p className="text-blue-700">{tokenInfo.decimals}</p>
                                </div>
                                <div>
                                    <Label className="text-blue-800">Source</Label>
                                    <Badge variant="secondary" className="text-xs">{tokenInfo.source}</Badge>
                                </div>
                                <div>
                                    <Label className="text-blue-800">Verified</Label>
                                    <p className="text-blue-700">{tokenInfo.verified ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Direct Mint Info Lookup */}
            <Card>
                <CardHeader>
                    <CardTitle>Get Token Info Directly from Mint</CardTitle>
                    <p className="text-gray-500 text-sm">
                        Using getMint from @solana/spl-token (most reliable method)
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="mint-input">Token Address</Label>
                        <Input
                            id="mint-input"
                            placeholder="Enter token mint address (e.g., So11111111111111111111111111111111111111112)"
                            value={addressInput}
                            onChange={(e) => setAddressInput(e.target.value)}
                        />
                    </div>

                    {addressInput && (
                        <MintInfoDisplay tokenAddress={addressInput} />
                    )}
                </CardContent>
            </Card>

            {/* API Usage Examples */}
            <Card>
                <CardHeader>
                    <CardTitle>API Usage Examples</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="mb-2 font-semibold">Search tokens by query:</h4>
                        <code className="block bg-gray-100 p-2 rounded text-sm">
                            GET /api/token/search?q=sol&includeUnverified=true&maxResults=10
                        </code>
                    </div>

                    <div>
                        <h4 className="mb-2 font-semibold">Get token by symbol:</h4>
                        <code className="block bg-gray-100 p-2 rounded text-sm">
                            GET /api/token/search?symbol=SOL
                        </code>
                    </div>

                    <div>
                        <h4 className="mb-2 font-semibold">Get decimals directly from mint:</h4>
                        <code className="block bg-gray-100 p-2 rounded text-sm">
                            import {'{'}getTokenDecimalsDirect{'}'} from '@/lib/utils/token-utils'<br />
                            const decimals = await getTokenDecimalsDirect(tokenAddress)
                        </code>
                    </div>

                    <div>
                        <h4 className="mb-2 font-semibold">Get full mint info:</h4>
                        <code className="block bg-gray-100 p-2 rounded text-sm">
                            import {'{'}getTokenMintInfo{'}'} from '@/lib/utils/token-utils'<br />
                            const mintInfo = await getTokenMintInfo(tokenAddress)
                        </code>
                    </div>

                    <div>
                        <h4 className="mb-2 font-semibold">Search with POST:</h4>
                        <code className="block bg-gray-100 p-2 rounded text-sm">
                            POST /api/token/search<br />
                            {JSON.stringify({
                                query: "bonk",
                                options: {
                                    includeUnverified: false,
                                    maxResults: 5,
                                    network: "mainnet"
                                }
                            }, null, 2)}
                        </code>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Component to display mint info
function MintInfoDisplay({ tokenAddress }: { tokenAddress: string }) {
    const [mintInfo, setMintInfo] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!tokenAddress.trim()) {
            setMintInfo(null)
            setIsLoading(false)
            setError(null)
            return
        }

        setIsLoading(true)
        setError(null)

        getTokenMintInfo(tokenAddress)
            .then((result) => {
                setMintInfo(result)
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : 'Failed to get mint info')
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [tokenAddress])

    if (isLoading) {
        return (
            <div className="flex items-center space-x-2 text-blue-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading mint info...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center space-x-2 text-red-500">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
            </div>
        )
    }

    if (!mintInfo) {
        return (
            <div className="text-gray-500">
                Enter a valid token mint address to see mint information
            </div>
        )
    }

    return (
        <div className="bg-blue-50 p-4 border border-blue-200 rounded-md">
            <div className="gap-4 grid grid-cols-2 text-sm">
                <div>
                    <Label className="text-blue-800">Decimals</Label>
                    <p className="font-mono text-blue-700">{mintInfo.decimals}</p>
                </div>
                <div>
                    <Label className="text-blue-800">Supply</Label>
                    <p className="font-mono text-blue-700">{mintInfo.supply.toString()}</p>
                </div>
                <div>
                    <Label className="text-blue-800">Initialized</Label>
                    <p className="text-blue-700">{mintInfo.isInitialized ? 'Yes' : 'No'}</p>
                </div>
                <div>
                    <Label className="text-blue-800">Mint Authority</Label>
                    <p className="font-mono text-blue-700 text-xs break-all">
                        {mintInfo.mintAuthority || 'None'}
                    </p>
                </div>
                <div>
                    <Label className="text-blue-800">Freeze Authority</Label>
                    <p className="font-mono text-blue-700 text-xs break-all">
                        {mintInfo.freezeAuthority || 'None'}
                    </p>
                </div>
            </div>
        </div>
    )
} 