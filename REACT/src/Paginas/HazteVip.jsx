import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import axiosInstance from "../axiosInstance";

const stripePromise = loadStripe("pk_test_51RGT2UEAe4ToeXLubfccnTNz06MMUuLb4mPR4t4LHw6KCDnGskDk8AT1rqD4jgLA7xPAi7wV6b32hQbK33Zvmm7o00V3oUsrd7");

const HazteVip = () => {
  const handleCheckout = async () => {
    try {
      const res = await axiosInstance.post("create-checkout-session/", {}, {
        headers: { "Content-Type": "application/json" },
      });

      const { id } = res.data;
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: id });
    } catch (error) {
      console.error("Error iniciando checkout:", error);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 text-center border border-gray-300 rounded-xl shadow-lg mt-12 bg-white">
      <h1 className="text-3xl font-bold mb-4">Hazte VIP</h1>
      <p className="text-lg mb-6">
        Por solo <strong>$9.99</strong> obtendrás acceso exclusivo a funcionalidades premium
      </p>
      <ul className="text-left text-base space-y-2 mb-8">
        <li>✅ Crea tus propios Meets</li>
        <li>✅ Logo VIP en tu perfil</li>
        <li>✅ Soporte prioritario</li>
      </ul>
      <button
        onClick={handleCheckout}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-medium py-3 px-6 rounded-lg transition-colors"
      >
        Hacerse VIP por $9.99
      </button>
    </div>
  );
};

export default HazteVip;
