import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      division,
      district,
      upazila,
      areaLocality,
      fullAddress,
      deliveryInstructions,
      shippingZoneKey,
      paymentMethod,
      couponCode,
      items,
      idempotencyKey,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "কার্টে কোনো পণ্য নেই।" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const adminSupabase = createSupabaseAdminClient();

    // Call atomic PostgreSQL RPC function to safely validate stock, calculate totals, and create order
    const { data: result, error } = await adminSupabase.rpc("create_order_atomic", {
      p_user_id: user ? user.id : null,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_customer_email: customerEmail || null,
      p_division: division,
      p_district: district,
      p_upazila: upazila,
      p_area_locality: areaLocality,
      p_full_address: fullAddress,
      p_delivery_instructions: deliveryInstructions || null,
      p_shipping_zone_key: shippingZoneKey,
      p_payment_method: paymentMethod,
      p_coupon_code: couponCode || null,
      p_idempotency_key: idempotencyKey || null,
      p_items: items,
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const orderData = result as {
      order_id: string;
      order_number: string;
      tracking_token: string;
      total_payable_bdt: number;
      duplicate_prevented: boolean;
    };

    // If payment method is SSLCOMMERZ, initiate sandbox/live session
    if (paymentMethod === "sslcommerz") {
      const storeId = process.env.SSLCOMMERZ_STORE_ID;
      const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
      const isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX !== "false";
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      if (!storeId || !storePassword) {
        return NextResponse.json({
          success: false,
          error: "SSLCOMMERZ credentials not configured on server. Please use Cash on Delivery.",
        }, { status: 400 });
      }

      const gatewayUrl = isSandbox
        ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.v1.php"
        : "https://securepay.sslcommerz.com/gwprocess/v4/api.v1.php";

      const tranId = `SASHROYI-${orderData.order_number}-${Date.now()}`;

      // Insert pending transaction record
      await adminSupabase.from("payment_transactions").insert({
        order_id: orderData.order_id,
        provider: "sslcommerz",
        transaction_id: tranId,
        amount_bdt: orderData.total_payable_bdt,
        status: "pending",
      });

      const formData = new URLSearchParams();
      formData.append("store_id", storeId);
      formData.append("store_passwd", storePassword);
      formData.append("total_amount", String(orderData.total_payable_bdt));
      formData.append("currency", "BDT");
      formData.append("tran_id", tranId);
      formData.append("success_url", `${siteUrl}/api/payment/sslcommerz/ipn`);
      formData.append("fail_url", `${siteUrl}/api/payment/sslcommerz/ipn`);
      formData.append("cancel_url", `${siteUrl}/api/payment/sslcommerz/ipn`);
      formData.append("cus_name", customerName);
      formData.append("cus_email", customerEmail || "customer@sashroyidaam.com");
      formData.append("cus_add1", fullAddress);
      formData.append("cus_city", district);
      formData.append("cus_country", "Bangladesh");
      formData.append("cus_phone", customerPhone);
      formData.append("shipping_method", "NO");
      formData.append("product_name", `Oshesh Order ${orderData.order_number}`);
      formData.append("product_category", "Retail");
      formData.append("product_profile", "general");

      const ssRes = await fetch(gatewayUrl, {
        method: "POST",
        body: formData,
      });

      const ssJson = await ssRes.json();

      if (ssJson && ssJson.status === "SUCCESS" && ssJson.GatewayPageURL) {
        return NextResponse.json({
          success: true,
          orderNumber: orderData.order_number,
          trackingToken: orderData.tracking_token,
          redirectUrl: ssJson.GatewayPageURL,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: ssJson?.failedreason || "SSLCOMMERZ gateway initiation failed.",
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: orderData.order_number,
      trackingToken: orderData.tracking_token,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
