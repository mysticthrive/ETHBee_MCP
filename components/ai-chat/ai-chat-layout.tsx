"use client"

import { useState } from "react"
import { AIChatInterface } from "@/components/ai-chat/ai-chat-interface"
import { TokenInfoPanel } from "@/components/ai-chat/token-info-panel"
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable"

type ActiveToken = {
  id: string
  symbol: string
  name: string
  price?: number
  priceChange?: number
}

export function AIChatLayout() {
  const [activeToken, setActiveToken] = useState<ActiveToken>({
    id: "solana",
    symbol: "SOL",
    name: "Solana",
  })

  // This function will be called when a token is mentioned in the chat
  const handleTokenMention = (token: ActiveToken) => {
    console.log("Token mentioned in chat:", token)
    setActiveToken(token)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Main Content */}
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left panel - Chat interface */}
          <ResizablePanel defaultSize={70} minSize={30} className="border-yellow-500/30 border-r">
            <div className="p-2 h-full">
              <AIChatInterface onTokenMention={handleTokenMention} />
            </div>
          </ResizablePanel>

          {/* Resizable handle */}
          <ResizableHandle withHandle className="bg-yellow-500/20 hover:bg-yellow-500/30" />

          {/* Right panel - Token information */}
          <ResizablePanel defaultSize={30} minSize={30}>
            <div className="p-2 h-full">
              <TokenInfoPanel token={activeToken} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
