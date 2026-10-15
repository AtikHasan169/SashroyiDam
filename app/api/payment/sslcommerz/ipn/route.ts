import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const tranId = formData.get("tran_id")?.toString();
    const status = formData.get("status")?.toString();
    const valId = formData.get("val_id")?.toString();
    const amount = formData.get("amount")?.toString();

    const adminSupabase = createSupabaseAdminClient();

    const { data: tx } = await adminSupabase
      .from("payment_transactions")
      .select("order_id, status")
      .eq("transaction_id", tranId)
      .single();

    if (!tx) {
      return NextResponse.redirect(new URL("/cart?error=invalid_transaction", request.url));
    }

    if (status === "VALID" || status === "VALIDATED") {
      // Update transaction status & order payment status idempotently
      await adminSupabase
        .from("payment_transactions")
        .update({ status: "paid", val_id: valId, updated_at: new Date().toISOString() })
        .eq("transaction_id", tranId);

      await adminSupabase
        .from("orders")
        .update({ payment_status: "paid", order_status: "confirmed" })
        .eq("id", tx.order_id);

      const { data: ord } = await adminSupabase
        .from("orders")
        .select("order_number, tracking_token")
        .eq("id", tx.order_id)
        .single();

      return NextResponse.redirect(
        new URL(`/order-success/${ord?.order_number}?token=${ord?.tracking_token}`, request.url)
      );
    } else {
      await adminSupabase
        .from("payment_transactions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("transaction_id", tranId);

      return NextResponse.redirect(new URL("/cart?error=payment_failed", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/cart?error=payment_error", request.url));
  }
}
