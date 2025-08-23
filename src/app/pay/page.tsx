

"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PayContent() {
  const params = useSearchParams()!;
  const userId = params.get("user_id");
  const type = params.get("type");
  const tier = params.get("tier");
  const days = params.get("days");
  // Placeholder price logic
  let price = 0;
  if (type === "agent") {
    price = 0; // Free trial, update later
  } else if (type === "fsbo") {
    price = 0;
  } else if (type === "landlord") {
    price = 0;
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 mt-10">
      <h1 className="text-2xl font-bold mb-4 text-teal-700">Complete Your Payment</h1>
      <div className="mb-4 text-lg">
        <div><span className="font-semibold">User ID:</span> {userId}</div>
        <div><span className="font-semibold">Type:</span> {type}</div>
        {tier && <div><span className="font-semibold">Tier:</span> {tier}</div>}
        {days && <div><span className="font-semibold">Days:</span> {days}</div>}
        <div><span className="font-semibold">Price:</span> ${price.toFixed(2)}</div>
      </div>
      <button className="w-full bg-gradient-to-r from-teal-500 via-green-400 to-orange-400 text-white text-lg py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-all duration-200" disabled>
        Pay Now (Coming Soon)
      </button>
      <div className="mt-4 text-gray-500 text-sm">Payment integration coming soon. You will be able to pay securely once enabled.</div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense>
      <PayContent />
    </Suspense>
  );
}
