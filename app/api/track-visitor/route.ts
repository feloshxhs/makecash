// app/api/track-visitor/route.ts - Enhanced with MongoDB persistence and Telegram notifications
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { visitorStore } from "@/lib/visitor-store-mongo";
import { getTelegramBot } from "@/lib/telegram-bot";

export async function POST(request: Request) {
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (jsonError) {
    console.error("[ERROR] Error parsing request JSON:", jsonError);
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  try {
    const { visitorId, selectedCryptos, isOnline, browserInfo } = requestBody;

    if (typeof visitorId !== "string" || !visitorId) {
      console.error("[ERROR] Invalid or missing visitorId.");
      return NextResponse.json(
        { error: "Visitor ID is required and must be a string" },
        { status: 400 }
      );
    }

    let visitor = await visitorStore.getVisitor(visitorId);

    if (!visitor) {
      visitor = await visitorStore.addVisitor(visitorId);

      // Send Telegram notification for new visitor
      const bot = getTelegramBot();
      if (bot) {
        await bot.notifyNewVisitor(visitor);
      }
    }

    // Update selected cryptos if provided
    if (Array.isArray(selectedCryptos)) {
      await visitorStore.updateSelectedCryptos(visitorId, selectedCryptos);
    }

    // Update online status and browser info
    if (typeof isOnline === "boolean" || typeof browserInfo === "string") {
      await visitorStore.updateOnlineStatusAndBrowserInfo(
        visitorId,
        isOnline,
        browserInfo
      );
    }

    // Fetch the latest visitor data
    visitor = await visitorStore.getVisitor(visitorId);

    const balancesArray = Object.entries(visitor?.balances || {}).map(
      ([cryptoId, balance]) => ({
        cryptoId,
        ...balance,
      })
    );

    const cryptoAddressesArray = Object.entries(
      visitor?.cryptoAddresses || {}
    ).map(([cryptoId, address]) => ({
      cryptoId,
      address,
    }));

    const response = {
      visitorId: visitor?.id,
      visitorName: visitor?.name,
      balances: balancesArray,
      resetRequested: visitor?.resetRequested,
      selectedCryptos: visitor?.selectedCryptos,
      cryptoAddresses: cryptoAddressesArray,
      isOnline: visitor?.isOnline,
      browserInfo: visitor?.browserInfo,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[ERROR] Unhandled error in main logic:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
