import { getDashboardMetrics } from "@/lib/services/analytics.service";
import * as dotenv from "dotenv";

dotenv.config();

async function test() {
  console.log("Executing getDashboardMetrics()...");
  try {
    const res = await getDashboardMetrics();
    console.log("Result metrics:", res.metrics);
  } catch (error) {
    console.error("Crash error in getDashboardMetrics:", error);
  }
}

test();
