'use client'

import React, { useState } from 'react'
import { Search, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useTokenLookup, TokenSearchResult } from '@/hooks/use-token-lookup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface TokenSearchProps {
    onTokenSelect?: (token: TokenSearchResult) => void
    placeholder?: string
    includeUnverified?: boolean
    maxResults?: number
    showAdvancedOptions?: boolean
    className?: string
}

export function TokenSearch({
    onTokenSelect,
    placeholder = "Search tokens by symbol or name...",
    includeUnverified = false,
    maxResults = 10,
    showAdvancedOptions = false,
    className = ""
}: TokenSearchProps) {
    const [showAdvanced, setShowAdvanced] = useState(showAdvancedOptions)
    const [includeUnverifiedState, setIncludeUnverifiedState] = useState(includeUnverified)

    const {
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        searchError,
        clearSearch,
        clearError
    } = useTokenLookup({
        includeUnverified: includeUnverifiedState,
        maxResults,
        debounceMs: 300
    })

    const handleTokenSelect = (token: TokenSearchResult) => {
        onTokenSelect?.(token)
        clearSearch()
    }

    const getSourceColor = (source: string) => {
        switch (source) {
            case 'jupiter':
                return 'bg-blue-500'
            case 'solana-token-list':
                return 'bg-green-500'
            case 'on-chain':
                return 'bg-yellow-500'
            case 'cache':
                return 'bg-purple-500'
            default:
                return 'bg-gray-500'
        }
    }

    const getSourceLabel = (source: string) => {
        switch (source) {
            case 'jupiter':
                return 'Jupiter'
            case 'solana-token-list':
                return 'Solana'
            case 'on-chain':
                return 'On-chain'
            case 'cache':
                return 'Cache'
            default:
                return source
        }
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search Input */}
            <div className="relative">
                <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 transform" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 pl-10"
                />
                {searchQuery && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearch}
                        className="top-1/2 right-2 absolute p-0 w-6 h-6 -translate-y-1/2 transform"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="include-unverified"
                                checked={includeUnverifiedState}
                                onCheckedChange={setIncludeUnverifiedState}
                            />
                            <Label htmlFor="include-unverified">Include unverified tokens</Label>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Message */}
            {searchError && (
                <div className="flex items-center space-x-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{searchError}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearError}
                        className="p-0 w-6 h-6"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Loading State */}
            {isSearching && (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    <span className="ml-2 text-gray-500">Searching tokens...</span>
                </div>
            )}

            {/* Search Results */}
            {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2">
                    <div className="text-gray-500 text-sm">
                        Found {searchResults.length} token{searchResults.length !== 1 ? 's' : ''}
                    </div>
                    {searchResults.map((token) => (
                        <Card
                            key={token.address}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleTokenSelect(token)}
                        >
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        {/* Token Logo */}
                                        {token.logoUrl ? (
                                            <img
                                                src={token.logoUrl}
                                                alt={token.symbol}
                                                className="rounded-full w-8 h-8"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <div className="flex justify-center items-center bg-gray-200 rounded-full w-8 h-8">
                                                <span className="font-medium text-gray-500 text-xs">
                                                    {token.symbol.charAt(0)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Token Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">{token.symbol}</span>
                                                {token.verified && (
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                )}
                                            </div>
                                            <div className="text-gray-500 text-sm">{token.name}</div>
                                        </div>
                                    </div>

                                    {/* Token Details */}
                                    <div className="flex items-center space-x-2">
                                        <Badge
                                            variant="secondary"
                                            className={`text-xs ${getSourceColor(token.source)} text-white`}
                                        >
                                            {getSourceLabel(token.source)}
                                        </Badge>
                                        <div className="text-gray-400 text-xs">
                                            {token.decimals} decimals
                                        </div>
                                    </div>
                                </div>

                                {/* Token Address */}
                                <div className="mt-2 font-mono text-gray-400 text-xs">
                                    {token.address}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* No Results */}
            {!isSearching && searchQuery && searchResults.length === 0 && !searchError && (
                <div className="py-8 text-gray-500 text-center">
                    <Search className="mx-auto mb-2 w-8 h-8 text-gray-300" />
                    <p>No tokens found for "{searchQuery}"</p>
                    <p className="text-sm">Try a different search term</p>
                </div>
            )}
        </div>
    )
}

// Export individual components for more specific use cases
export function TokenSearchInput({
    onTokenSelect,
    placeholder = "Search tokens...",
    className = ""
}: {
    onTokenSelect?: (token: TokenSearchResult) => void
    placeholder?: string
    className?: string
}) {
    const { searchQuery, setSearchQuery, searchResults, isSearching } = useTokenLookup({
        maxResults: 5,
        debounceMs: 300
    })

    return (
        <div className={`relative ${className}`}>
            <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 transform" />
            <Input
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
            />

            {/* Dropdown Results */}
            {searchQuery && searchResults.length > 0 && (
                <div className="top-full right-0 left-0 z-50 absolute bg-white shadow-lg mt-1 border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                    {searchResults.map((token) => (
                        <div
                            key={token.address}
                            className="flex items-center space-x-2 hover:bg-gray-50 px-3 py-2 cursor-pointer"
                            onClick={() => onTokenSelect?.(token)}
                        >
                            <span className="font-medium">{token.symbol}</span>
                            <span className="text-gray-500 text-sm">{token.name}</span>
                            {token.verified && <CheckCircle className="ml-auto w-4 h-4 text-green-500" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
} 