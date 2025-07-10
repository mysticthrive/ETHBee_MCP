import { NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase/utils"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Get pending orders
    const { data: pendingOrders } = await supabase
      .from("booking_orders")
      .select("*")
      .eq("status", "pending")

    // Get recent events
    const { data: recentEvents } = await supabase
      .from("booking_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      data: {
        pendingOrders: pendingOrders || [],
        recentEvents: recentEvents || [],
      },
    })
  } catch (error) {
    console.error("Error getting monitor status:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to get monitor status" },
      { status: 500 }
    )
  }
}
