"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PhoneInput, { type Value as PhoneValue } from "react-phone-number-input";
import { Toaster, toast } from "react-hot-toast";
import "react-phone-number-input/style.css";

const DEFAULT_SUBMIT_LOCK_SECONDS = 5;
const SUBMIT_LOCK_KEY = "register_submit_lock_until";

function toPositiveInteger(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  if (parsed <= 0) return undefined;
  return Math.floor(parsed);
}

function getCooldownSecondsFromResponse(
  response: Response,
  bodyCooldownSeconds?: number,
) {
  const retryAfterSeconds = toPositiveInteger(response.headers.get("retry-after"));
  if (retryAfterSeconds) return retryAfterSeconds;

  const windowSeconds = toPositiveInteger(
    response.headers.get("x-rate-limit-window"),
  );
  if (windowSeconds) return windowSeconds;

  const bodySeconds = toPositiveInteger(bodyCooldownSeconds);
  if (bodySeconds) return bodySeconds;

  return DEFAULT_SUBMIT_LOCK_SECONDS;
}

type ContactForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
};

export default function Contact() {
  const router = useRouter();

  const [form, setForm] = useState<ContactForm>({
    fullName: "",
    email: "",
    phoneNumber: "+855",
  });

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current)
        clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  const isFormValid = useMemo(() => {
    return (
      form.fullName.trim() !== "" &&
      form.email.trim() !== "" &&
      form.phoneNumber.trim() !== "" &&
      form.phoneNumber.startsWith("+855") &&
      form.phoneNumber.length > 11
    );
  }, [form.fullName, form.email, form.phoneNumber]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => (name in prev ? { ...prev, [name]: value } : prev));
  };

  const handlePhoneChange = (value: PhoneValue) => {
    const nextValue = (value ?? "+855").toString();
    setForm((prev) => ({
      ...prev,
      phoneNumber: nextValue.startsWith("+855") ? nextValue : "+855",
    }));
  };

  const startCooldown = useCallback((seconds: number) => {
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);

    setCooldown(seconds);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current)
            clearInterval(cooldownIntervalRef.current);
          cooldownIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    const lockUntilRaw = window.localStorage.getItem(SUBMIT_LOCK_KEY);
    const lockUntil = Number(lockUntilRaw);
    const remainingMs = Number.isFinite(lockUntil) ? lockUntil - Date.now() : 0;

    if (remainingMs > 0) {
      startCooldown(Math.ceil(remainingMs / 1000));
      return;
    }

    if (lockUntilRaw) window.localStorage.removeItem(SUBMIT_LOCK_KEY);
  }, [startCooldown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (cooldown > 0) {
      toast.error(
        `Please wait ${cooldown} seconds before sending another message.`,
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/sendmessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form satisfies ContactForm),
      });

      const data: { error?: string; details?: string; cooldownSeconds?: number } = await response
        .json()
        .catch(() => ({}));

      if (response.ok) {
        const cooldownSeconds = getCooldownSecondsFromResponse(
          response,
          data.cooldownSeconds,
        );

        window.localStorage.setItem(
          SUBMIT_LOCK_KEY,
          String(Date.now() + cooldownSeconds * 1000),
        );

        setForm({
          fullName: "",
          email: "",
          phoneNumber: "+855",
        });

        startCooldown(cooldownSeconds);
        setShowSuccessModal(true);
        return;
      }

      if (response.status === 429) {
        const cooldownSeconds = getCooldownSecondsFromResponse(
          response,
          data.cooldownSeconds,
        );
        startCooldown(cooldownSeconds);
        window.localStorage.setItem(
          SUBMIT_LOCK_KEY,
          String(Date.now() + cooldownSeconds * 1000),
        );
        toast.error(data.error || "Too many requests. Please try again later.");
        return;
      }

      toast.error(
        data.details
          ? `${data.error || "Something went wrong."} ${data.details}`
          : data.error || "Something went wrong.",
      );
    } catch {
      toast.error("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-neutral-50 min-h-screen flex items-center justify-center">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
          },
        }}
      />
      <section className="flex flex-col items-center p-4 text-center max-w-md w-full">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-center text-2xl font-bold text-center text-black mb-4"
        >
          <span className="mx-2">Registration Form</span>
        </motion.h1>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-210 mt-4"
        >
          <div className="mb-4 space-y-4">
            {/* Full Name */}
            <motion.div whileFocus={{ scale: 1.02 }}>
              <label className="block text-sm font-semibold text-start text-black">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 mt-2 border rounded-full outline-none focus:ring-2 focus:ring-black/20 border-black/40 bg-transparent text-black"
                placeholder="Enter your full name"
              />
            </motion.div>

            {/* Email */}
            <motion.div whileFocus={{ scale: 1.02 }}>
              <label className="block text-sm font-semibold text-start text-black">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                autoComplete="off"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 mt-2 border rounded-full outline-none focus:ring-2 focus:ring-black/20 border-black/40 bg-transparent text-black"
                placeholder="Enter your email"
              />
            </motion.div>
          </div>

          {/* Phone */}
          <motion.div whileFocus={{ scale: 1.02 }} className="mb-4">
            <label className="block mb-2 text-sm font-semibold text-start text-black">
              Phone number <span className="text-red-500">*</span>
            </label>

            <PhoneInput
              international
              defaultCountry="KH"
              countries={["KH"]}
              countryCallingCodeEditable={false}
              countrySelectProps={{ disabled: true }}
              value={form.phoneNumber}
              onChange={handlePhoneChange}
              className="w-full px-4 py-2 border rounded-full outline-none focus-within:ring-2 focus-within:ring-black/20 border-black/40 bg-transparent text-black"
              placeholder="Enter your phone number"
              style={
                {
                  "--PhoneInputCountryFlag-borderColor": "transparent",
                } as React.CSSProperties
              }
            />
          </motion.div>

          {/* Submit */}
          <motion.button
            type="submit"
            whileHover={{
              scale: isFormValid && !loading && cooldown === 0 ? 1.05 : 1,
            }}
            whileTap={{
              scale: isFormValid && !loading && cooldown === 0 ? 0.95 : 1,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className={`w-full py-3 font-semibold text-white rounded-3xl transition-colors mt-4 ${
              !isFormValid || loading || cooldown > 0
                ? "bg-neutral-300 cursor-not-allowed"
                : "bg-[#0F75BC]"
            }`}
            disabled={!isFormValid || loading || cooldown > 0}
          >
            {loading
              ? "Sending..."
              : cooldown > 0
                ? `Please wait ${cooldown}s`
                : "Send message"}
          </motion.button>
        </motion.form>
      </section>

      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            initial={{ y: 20, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <h2
              id="success-modal-title"
              className="text-2xl font-bold text-[#0F75BC]"
            >
              Thank you!
            </h2>
            <p className="mt-3 text-sm text-neutral-700">
              Your form was submitted successfully. We appreciate your interest
              and will contact you soon.
            </p>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                router.replace("/");
              }}
              className="mt-6 w-full rounded-full bg-[#0F75BC] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#0d67a6]"
            >
              Back to Home
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
