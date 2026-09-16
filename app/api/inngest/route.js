import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import {
  syncUsercreation,
  syncUserupdation,
  syncUserdeletion,
  deleteCouponOnExpiry,
  sendOrderConfirmedEmail,
} from "../../../inngest/functions";
import { generateWeeklyInsights } from "../../../inngest/storeHealth";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncUsercreation,
    syncUserupdation,
    syncUserdeletion,
    deleteCouponOnExpiry,
    sendOrderConfirmedEmail,
    generateWeeklyInsights,
  ],
});