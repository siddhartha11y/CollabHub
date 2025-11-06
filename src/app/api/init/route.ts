import { NextRequest, NextResponse } from "next/server"
import { initializeEmailSystem } from "@/lib/email-optimizer"

// Initialize email system on first API call
let initialized = false

export async function GET(req: NextRequest) {
  if (!initialized) {
    console.log("🚀 Initializing email system...")
    initializeEmailSystem()
    initialized = true
  }
  
  return NextResponse.json({ 
    status: "Email system initialized",
    timestamp: new Date().toISOString()
  })
}

// Also initialize on any POST request to this endpoint
export async function POST(req: NextRequest) {
  return GET(req)
}