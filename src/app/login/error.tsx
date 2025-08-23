"use client";
import React from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
      <h2 className="text-2xl font-bold text-red-700 mb-4">Something went wrong</h2>
      <p className="mb-4 text-gray-700">{error?.message || "An unexpected error occurred. Please try again."}</p>
      <button
        onClick={() => reset()}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold"
      >
        Try Again
      </button>
    </div>
  );
}
