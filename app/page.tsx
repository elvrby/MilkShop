"use client";

import { useState } from "react";
import Script from "next/script";
import Image from "next/image";

// Deklarasi global agar TypeScript mengenali window.snap
declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        callbacks: {
          onSuccess: (result: unknown ) => void;
          onPending: (result: unknown ) => void;
          onError: (result: unknown) => void;
          onClose: () => void;
        }
      ) => void;
    };
  }
}

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export default function Home() {
  // Data awal produk
  const initialProducts: Product[] = [
    { id: "susu-loli", name: "Susu Loli", price: 17000, quantity: 0 },
    { id: "susu-neesaan", name: "Susu Neesaan", price: 25000, quantity: 0 },
    { id: "susu-mommy", name: "Susu Mommy", price: 50000, quantity: 0 },
  ];

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [shippingDestination, setShippingDestination] = useState<string>("Jakarta");
  const [shippingCost, setShippingCost] = useState<number>(9000);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Hitung total harga produk yang dipilih
  const productTotal = products.reduce(
    (acc, product) => acc + product.price * product.quantity,
    0
  );
  const totalPrice = productTotal + shippingCost;

  // Update quantity produk
  const handleQuantityChange = (id: string, value: string) => {
    const newQuantity = parseInt(value, 10) || 0;
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === id ? { ...product, quantity: newQuantity } : product
      )
    );
  };

  // Update opsi pengiriman
  const handleShippingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDestination = e.target.value;
    setShippingDestination(selectedDestination);

    if (selectedDestination === "Palembang") {
      setShippingCost(20000);
    } else if (selectedDestination === "Bandung") {
      setShippingCost(12000);
    }
    else if (selectedDestination === "Jakarta") {
      setShippingCost(9000);
    }
  };

  // Proses transaksi order
  const handleBuyOrder = async (): Promise<void> => {
    if (productTotal === 0) {
      alert("Silakan pilih minimal satu produk.");
      return;
    }
    setIsProcessing(true);
    const orderId = `order-${Date.now()}`;

    try {
      const res = await fetch("/api/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          items: products, // Kirim array produk beserta quantity
          shippingCost,
          shippingDestination,
        }),
      });
      const data = await res.json();

      if (data.token) {
        // Panggil Midtrans Snap untuk memproses pembayaran
        window.snap.pay(data.token, {
          onSuccess: (result: unknown ) => {
            alert("Pembayaran berhasil!");
            console.log("Success:", result);
          },
          onPending: (result: unknown ) => {
            alert("Pembayaran pending!");
            console.log("Pending:", result);
          },
          onError: (result: unknown ) => {
            alert("Pembayaran gagal!");
            console.log("Error:", result);
          },
          onClose: () => {
            alert("Popup pembayaran ditutup tanpa menyelesaikan pembayaran.");
          },
        });
      } else {
        alert("Gagal mendapatkan token transaksi.");
        console.error(data);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat memproses pembayaran.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-black">
      <h1 className="text-4xl font-bold text-center mb-8">Susu Shop</h1>
      <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
        {/* Kolom Kiri: Pilih Produk */}
        <div className="bg-white shadow-lg rounded-lg p-6 flex-1">
          <h2 className="text-2xl font-semibold mb-4">Pilih Produk</h2>
          <Image src={"/SusuUltra.jpg"} alt="Susu" width={800} height={500}></Image>
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-medium">{product.name}</p>
                <p className="text-sm text-gray-600">
                  Harga: Rp {product.price.toLocaleString("id-ID")}
                </p>
              </div>
              <input
                type="number"
                min="0"
                value={product.quantity}
                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                className="w-20 p-2 border border-gray-300 rounded-md"
              />
            </div>
          ))}
          <div className="border-t pt-4 mt-4">
            <p className="text-lg font-semibold">
              Total Produk: Rp {productTotal.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Opsi Pengiriman & Ringkasan Order */}
        <div className="bg-white shadow-lg rounded-lg p-6 flex-1">
          <h2 className="text-2xl font-semibold mb-4">Opsi Pengiriman</h2>
          <div className="mb-4">
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Tujuan Pengiriman:
            </label>
            <select
              id="destination"
              value={shippingDestination}
              onChange={handleShippingChange}
              className="block w-full p-2 border border-gray-300 rounded-md">
              <option value="Jakarta">Jakarta - Rp9.000</option>
              <option value="Bandung">Bandung - Rp12.000</option>
              <option value="Palembang">Palembang - Rp20.000</option>
            </select>
          </div>
          <p className="text-lg mb-2">
            Ongkos Kirim:{" "}
            <span className="font-bold">Rp {shippingCost.toLocaleString("id-ID")}</span>
          </p>
          <hr className="my-4" />
          <p className="text-xl font-bold mb-4">
            Total Pembayaran: Rp {totalPrice.toLocaleString("id-ID")}
          </p>
          <button
            onClick={handleBuyOrder}
            disabled={isProcessing}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-md transition duration-300 disabled:opacity-50"
          >
            {isProcessing ? "Memproses..." : "Beli & Bayar"}
          </button>
        </div>
      </div>
      {/* Sertakan script Midtrans Snap (sandbox) */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="beforeInteractive"
      />
    </div>
  );
}
