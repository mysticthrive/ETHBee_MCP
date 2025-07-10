"use client"

import { CustomButton } from "@/components/ui-custom/CustomButton"

export default function TestPage() {
    return (
        <div className="bg-black p-8 min-h-screen text-white">
            <h1 className="mb-8 font-bold text-3xl">Component Test Page</h1>
            <div className="space-y-4">
                <div>
                    <h2 className="mb-2 font-semibold text-xl">Custom Buttons</h2>
                    <div className="flex items-center gap-4">
                        <CustomButton customVariant="gradient" size="lg">
                            Gradient Button
                        </CustomButton>
                        <CustomButton customVariant="outlineYellow" size="lg">
                            Outline Button
                        </CustomButton>
                        <CustomButton customVariant="textOnly">
                            Text Only Button
                        </CustomButton>
                        <CustomButton customVariant="dark" size="lg">
                            Dark Button
                        </CustomButton>
                    </div>
                </div>
            </div>
            <div className="mt-12">
                <h2 className="mb-2 font-semibold text-xl">Brand & Palette Colors</h2>
                <div className="gap-4 grid grid-cols-2 sm:grid-cols-4">
                    {/* Primary Branding Blue */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: 'hsl(217.2,91.2%,59.8%)' }} />
                        <span className="mt-2 text-xs">Primary Blue<br />hsl(217.2,91.2%,59.8%)</span>
                    </div>
                    {/* Accent Yellow */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#FFD600' }} />
                        <span className="mt-2 text-xs">Accent Yellow<br />#FFD600</span>
                    </div>
                    {/* Palette: Deep Navy */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#1A237E' }} />
                        <span className="mt-2 text-xs">Deep Navy<br />#1A237E</span>
                    </div>
                    {/* Palette: Gold */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#FFC107' }} />
                        <span className="mt-2 text-xs">Gold<br />#FFC107</span>
                    </div>
                    {/* Palette: Sky Blue */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#4FC3F7' }} />
                        <span className="mt-2 text-xs">Sky Blue<br />#4FC3F7</span>
                    </div>
                    {/* Palette: Dark Yellow */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#FFB300' }} />
                        <span className="mt-2 text-xs">Dark Yellow<br />#FFB300</span>
                    </div>
                </div>
            </div>
            <div className="mt-12">
                <h2 className="mb-2 font-semibold text-xl">Suggested UI Palette</h2>
                <div className="gap-4 grid grid-cols-2 sm:grid-cols-4">
                    {/* Primary: Yellow-500 */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#F59E0B' }} />
                        <span className="mt-2 text-xs">Primary<br />#F59E0B</span>
                    </div>
                    {/* Secondary: Dark Gray */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#374151' }} />
                        <span className="mt-2 text-xs">Secondary<br />#374151</span>
                    </div>
                    {/* Background: Light Gray */}
                    <div className="flex flex-col items-center">
                        <div className="border rounded-lg w-20 h-20" style={{ background: '#F3F4F6' }} />
                        <span className="mt-2 text-gray-800 text-xs">Background<br />#F3F4F6</span>
                    </div>
                    {/* Buttons/Highlights: Deep Blue */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#3B82F6' }} />
                        <span className="mt-2 text-xs">Button/Highlight<br />#3B82F6</span>
                    </div>
                    {/* Text: Almost Black */}
                    <div className="flex flex-col items-center">
                        <div className="border rounded-lg w-20 h-20" style={{ background: '#111827' }} />
                        <span className="mt-2 text-gray-200 text-xs">Text<br />#111827</span>
                    </div>
                    {/* Gold Accent */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#D69E2E' }} />
                        <span className="mt-2 text-xs">Gold Accent<br />#D69E2E</span>
                    </div>
                    {/* Success: Teal */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#14B8A6' }} />
                        <span className="mt-2 text-xs">Success<br />#14B8A6</span>
                    </div>
                    {/* Error: Red */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#EF4444' }} />
                        <span className="mt-2 text-xs">Error<br />#EF4444</span>
                    </div>
                </div>
            </div>
            <div className="mt-12">
                <h2 className="mb-2 font-semibold text-xl">Amber-500 Based Palette</h2>
                <div className="gap-4 grid grid-cols-2 sm:grid-cols-4">
                    {/* Amber-500 */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#F59E0B' }} />
                        <span className="mt-2 text-xs">Amber-500<br />#F59E0B</span>
                    </div>
                    {/* Dark Gray / Charcoal */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#374151' }} />
                        <span className="mt-2 text-xs">Dark Gray<br />#374151</span>
                    </div>
                    {/* Light Gray / Background */}
                    <div className="flex flex-col items-center">
                        <div className="border rounded-lg w-20 h-20" style={{ background: '#F3F4F6' }} />
                        <span className="mt-2 text-gray-800 text-xs">Light Gray<br />#F3F4F6</span>
                    </div>
                    {/* Deep Blue / Indigo */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#3B82F6' }} />
                        <span className="mt-2 text-xs">Deep Blue<br />#3B82F6</span>
                    </div>
                    {/* White */}
                    <div className="flex flex-col items-center">
                        <div className="border rounded-lg w-20 h-20" style={{ background: '#FFFFFF' }} />
                        <span className="mt-2 text-gray-800 text-xs">White<br />#FFFFFF</span>
                    </div>
                    {/* Emerald Green */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#10B981' }} />
                        <span className="mt-2 text-xs">Emerald Green<br />#10B981</span>
                    </div>
                    {/* Red / Error */}
                    <div className="flex flex-col items-center">
                        <div className="rounded-lg w-20 h-20" style={{ background: '#EF4444' }} />
                        <span className="mt-2 text-xs">Red / Error<br />#EF4444</span>
                    </div>
                </div>
            </div>
        </div>
    )
}