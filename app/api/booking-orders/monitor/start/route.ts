import { NextResponse } from "next/server"
import { optimizedBookingMonitor } from "@/lib/services/booking-monitor-optimized-service"

export async function POST() {
  try {
    await optimizedBookingMonitor.start()

    return NextResponse.json({
      success: true,
      message: "Booking monitor service started successfully",
      status: optimizedBookingMonitor.getStatus(),
    })
  } catch (error) {
    console.error("Error starting booking monitor:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error starting monitor",
      },
      { status: 500 },
    )
  }
}
