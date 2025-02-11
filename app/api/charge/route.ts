// app/api/charge/route.ts
import midtransClient from 'midtrans-client';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { orderId, items, shippingCost, shippingDestination } = body;
    
    // Hitung total harga produk dan susun item_details untuk Midtrans
    let productTotal = 0;
    const item_details: Array<{
      id: string;
      price: number;
      quantity: number;
      name: string;
    }> = [];

    items.forEach((item: { id: string; name: string; price: number; quantity: number; }) => {
      if (item.quantity > 0) {
        productTotal += item.price * item.quantity;
        item_details.push({
          id: item.id,
          price: item.price,
          quantity: item.quantity,
          name: item.name,
        });
      }
    });

    // Total keseluruhan (produk + ongkir)
    const totalAmount = productTotal + shippingCost;

    // Tambahkan ongkos kirim sebagai item tersendiri
    item_details.push({
      id: "shipping-001",
      price: shippingCost,
      quantity: 1,
      name: `Ongkos Kirim ke ${shippingDestination}`,
    });

    // Inisialisasi Midtrans Snap (sandbox mode)
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalAmount,
      },
      item_details,
      credit_card: {
        secure: true,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return new Response(JSON.stringify(transaction), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan pada server" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
