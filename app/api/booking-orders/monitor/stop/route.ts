import { NextResponse } from "next/server"
import { optimizedBookingMonitor } from "@/lib/services/booking-monitor-optimized-service"

export async function POST() {
  try {
    optimizedBookingMonitor.stop()

    return NextResponse.json({
      success: true,
      message: "Booking monitor service stopped successfully",
    })
  } catch (error) {
    console.error("Error stopping booking monitor:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error stopping monitor",
      },
      { status: 500 },
    )
  }
}
