// app/api/admin/visitors/route.ts - Enhanced with debug logging
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { visitorStore } from "@/lib/visitor-store-mongo";

export async function GET() {
  // console.log("[DEBUG] /api/admin/visitors - Request received at:", new Date().toISOString())

  try {
    const allVisitors = await visitorStore.getAllVisitors();
    const serializableVisitors = allVisitors; // No .toObject() needed
    const response = { visitors: serializableVisitors };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[ERROR] Error fetching all visitors:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
