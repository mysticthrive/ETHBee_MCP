"use client"

import { useEffect, useRef, useState } from "react"

let tvScriptLoadingPromise: Promise<void> | null = null

interface TradingViewChartProps {
  symbol?: string
  interval?: string
  onPositionRecommendation?: (recommendation: any) => void
}

interface AIRecommendationLine {
  id: string
  type: "entry" | "target" | "stop_loss" | "support" | "resistance"
  price: number
  time: number
  color: string
  label: string
  confidence?: number
}

export function TradingViewChart({
  symbol = "BINANCE:SOLUSDT",
  interval = "1D",
  onPositionRecommendation,
}: TradingViewChartProps) {
  const onLoadScriptRef = useRef<(() => void) | null>(null)
  const widgetRef = useRef<any>(null)
  const chartRef = useRef<any>(null)
  const [aiLines, setAiLines] = useState<AIRecommendationLine[]>([])
  const [showAILines, setShowAILines] = useState(true)
  const [chartReady, setChartReady] = useState(false)

  // Generate AI recommendation lines
  const generateAILines = (currentPrice: number): AIRecommendationLine[] => {
    const now = Math.floor(Date.now() / 1000) // TradingView uses Unix timestamp in seconds
    const oneHour = 3600

    return [
      {
        id: "ai_entry_1",
        type: "entry",
        price: currentPrice * 0.98,
        time: now - 2 * oneHour,
        color: "#00FF88",
        label: "AI Buy Entry",
        confidence: 0.85,
      },
      {
        id: "ai_target_1",
        type: "target",
        price: currentPrice * 1.12,
        time: now + 24 * oneHour,
        color: "#FFD700",
        label: "AI Target 1",
        confidence: 0.78,
      },
      {
        id: "ai_stop_loss",
        type: "stop_loss",
        price: currentPrice * 0.92,
        time: now - oneHour,
        color: "#FF4444",
        label: "AI Stop Loss",
      },
    ]
  }

  useEffect(() => {
    onLoadScriptRef.current = createWidget

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement("script")
        script.id = "tradingview-widget-loading-script"
        script.src = "https://s3.tradingview.com/charting_library/charting_library.min.js"
        script.type = "text/javascript"
        script.onload = () => resolve()
        script.onerror = () => {
          // Fallback to basic widget if charting library fails
          const fallbackScript = document.createElement("script")
          fallbackScript.src = "https://s3.tradingview.com/tv.js"
          fallbackScript.onload = () => resolve()
          document.head.appendChild(fallbackScript)
        }

        document.head.appendChild(script)
      })
    }

    tvScriptLoadingPromise.then(() => onLoadScriptRef.current && onLoadScriptRef.current())


    function createWidget() {
      if (document.getElementById("tradingview_chart") && window.TradingView) {
        try {
          // Try advanced charting library first
          if (window.TradingView.widget && window.TradingView.version) {
            createAdvancedChart()
          } else {
            // Fallback to basic widget
            createBasicWidget()
          }
        } catch (error) {
          console.log("Advanced chart failed, using basic widget:", error)
          createBasicWidget()
        }
      }
    }

    function createAdvancedChart() {
      const widget = new (window as any).TradingView.widget({
        width: "100%",
        height: "100%",
        symbol: symbol,
        interval: interval,
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#1E1E1E",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: "tradingview_chart",
        datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed("https://demo_feed.tradingview.com"),
        library_path: "/charting_library/",
        custom_css_url: "/charting_library/custom.css",
        overrides: {
          "paneProperties.background": "#0F0F0F",
          "paneProperties.vertGridProperties.color": "rgba(255, 193, 7, 0.1)",
          "paneProperties.horzGridProperties.color": "rgba(255, 193, 7, 0.1)",
        },
        studies_overrides: {},
        disabled_features: ["header_symbol_search", "symbol_search_hot_key"],
        enabled_features: ["study_templates"],
      })

      widgetRef.current = widget

      widget.onChartReady(() => {
        console.log("Advanced chart ready")
        chartRef.current = widget.chart()
        setChartReady(true)

        // Generate and add AI lines
        const currentPrice = 143.25 // Mock price for SOL
        const lines = generateAILines(currentPrice)
        setAiLines(lines)
        addAILinesToChart(lines)
      })
    }

    function createBasicWidget() {
      const widget = new (window as any).TradingView.widget({
        autosize: true,
        symbol: symbol,
        interval: interval,
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#1E1E1E",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: "tradingview_chart",
        hide_side_toolbar: false,
        studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
        disabled_features: ["header_symbol_search"],
        overrides: {
          "paneProperties.background": "#0F0F0F",
          "paneProperties.vertGridProperties.color": "rgba(255, 193, 7, 0.1)",
          "paneProperties.horzGridProperties.color": "rgba(255, 193, 7, 0.1)",
        },
      })

      widgetRef.current = widget
      setChartReady(true)

      // For basic widget, generate AI lines for overlay display
      const currentPrice = 143.25
      const lines = generateAILines(currentPrice)
      setAiLines(lines)
    }
  }, [symbol, interval])

  const addAILinesToChart = (lines: AIRecommendationLine[]) => {
    if (!chartRef.current || !showAILines) return

    try {
      lines.forEach((line) => {
        // Create horizontal line
        const lineId = chartRef.current.createMultipointShape([{ time: line.time, price: line.price }], {
          shape: "horizontal_line",
          lock: false,
          disableSelection: false,
          disableSave: false,
          disableUndo: false,
          zOrder: "top",
          lineColor: line.color,
          lineStyle: line.type === "entry" ? 0 : line.type === "target" ? 2 : 1,
          lineWidth: 2,
          text: line.label,
          textColor: line.color,
          fontSize: 12,
        })

        console.log(`Added AI line: ${line.label} at price ${line.price}`)
      })
    } catch (error) {
      console.log("Error adding lines to advanced chart:", error)
    }
  }

  const toggleAILines = () => {
    const newShowState = !showAILines
    setShowAILines(newShowState)

    if (chartRef.current) {
      try {
        if (newShowState) {
          // Add lines back
          addAILinesToChart(aiLines)
        } else {
          // Remove all shapes
          chartRef.current.removeAllShapes()
        }
      } catch (error) {
        console.log("Error toggling AI lines:", error)
      }
    }
  }

  return (
    <div className="relative bg-gray-900/50 border border-yellow-500/20 rounded-lg w-full h-full overflow-hidden">
      <div className="flex justify-between items-center p-4 border-yellow-500/20 border-b">
        <div>
          <h3 className="font-semibold text-white">{symbol}</h3>
          <p className="text-gray-400 text-sm">TradingView Chart - {interval}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleAILines}
            disabled={!chartReady}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${showAILines
              ? "bg-yellow-600/20 border border-yellow-500/50 text-yellow-400"
              : "bg-gray-600/20 border border-gray-500/50 text-gray-400"
              } ${!chartReady ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            AI Lines {showAILines ? "ON" : "OFF"}
          </button>
          <div className="text-gray-400 text-xs">{aiLines.length} signals</div>
        </div>
      </div>

      <div className="relative w-full" style={{ height: "calc(100% - 60px)" }}>
        <div id="tradingview_chart" style={{ height: "100%", width: "100%" }} />

        {/* Loading State */}
        {!chartReady && (
          <div className="absolute inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 border-yellow-400 border-b-2 rounded-full w-8 h-8 animate-spin"></div>
              <p className="text-gray-400">Loading TradingView Chart...</p>
            </div>
          </div>
        )}

        {/* AI Lines Info Panel - Always visible for reference */}
        {showAILines && aiLines.length > 0 && (
          <div className="bottom-4 left-4 absolute bg-black/90 backdrop-blur-sm p-3 border border-yellow-500/20 rounded-lg max-w-xs">
            <div className="mb-2 font-medium text-yellow-400 text-xs">AI Recommendation Lines</div>
            <div className="space-y-1">
              {aiLines.map((line) => (
                <div key={line.id} className="flex justify-between items-center text-xs">
                  <div className="flex items-center">
                    <div className="mr-2 w-3 h-0.5" style={{ backgroundColor: line.color }} />
                    <span className="text-gray-300 capitalize">{line.type.replace("_", " ")}</span>
                  </div>
                  <span className="font-mono text-white">${line.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-yellow-500/20 border-t">
              <div className="text-gray-400 text-xs">{chartRef.current ? "Lines drawn on chart" : "Overlay mode"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
