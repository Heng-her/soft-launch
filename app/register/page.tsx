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
  const retryAfterSeconds = toPositiveInteger(
    response.headers.get("retry-after"),
  );
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
  company: string;
  phoneNumber: string;
};

export default function Contact() {
  const router = useRouter();

  const [form, setForm] = useState<ContactForm>({
    fullName: "",
    company: "",
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
    const fullNameValid = form.fullName.trim() !== "";

    // Company and phone are optional. If provided, validate lightly.
    const company = form.company.trim();
    const companyValid = company.length <= 254; // optional, max length

    const phone = form.phoneNumber?.trim() ?? "";
    const phoneProvided = phone !== "" && phone !== "+855";
    const phoneValid =
      !phoneProvided || (phone.startsWith("+855") && phone.length > 11);

    return fullNameValid && companyValid && phoneValid;
  }, [form.fullName, form.company, form.phoneNumber]);

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

      const data: {
        error?: string;
        details?: string;
        cooldownSeconds?: number;
      } = await response.json().catch(() => ({}));

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
          company: "",
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
    <div className="w-full bg-linear-to-b from-[#001c33] to-[#095693] min-h-screen flex items-center justify-center relative overflow-x-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
          },
        }}
      />
      <section className="flex flex-col items-center p-4 text-center max-w-md w-full ">
        <div className="w-full flex items-center justify-start mb-4 absolute top-4 left-4">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-white/80 rounded-full shadow-lg transition-all duration-300 z-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-[#095693]"
            >
              <path
                fillRule="evenodd"
                d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-center text-2xl font-bold text-center text-white mb-4"
        >
          <span className="mx-2 uppercase">Registration</span>
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
              <label className="block text-sm font-semibold text-start text-white">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 mt-2 border rounded-full outline-none focus:ring-2 focus:ring-white/40 border-white/40 bg-transparent text-white"
                placeholder="Enter your full name"
              />
            </motion.div>

            {/* Email */}
            <motion.div whileFocus={{ scale: 1.02 }}>
              <label className="block text-sm font-semibold text-start text-white">
                Company <span className="text-sm text-slate-300 font-light">(optional)</span>
              </label>
              <input
                autoComplete="off"
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                className="w-full px-4 py-3 mt-2 border rounded-full outline-none focus:ring-2 focus:ring-white/40 border-white/40 bg-transparent text-white"
                placeholder="Enter your company (optional)"
              />
            </motion.div>
          </div>

          {/* Phone */}
          <motion.div whileFocus={{ scale: 1.02 }} className="mb-4">
            <label className="block mb-2 text-sm font-semibold text-start text-white">
              Phone number <span className="text-sm text-slate-300 font-light">(optional)</span>
            </label>

            <PhoneInput
              international
              defaultCountry="KH"
              countries={["KH"]}
              countryCallingCodeEditable={false}
              countrySelectProps={{ disabled: true }}
              value={form.phoneNumber}
              onChange={handlePhoneChange}
              className="w-full px-4 py-2.5 border rounded-full outline-none focus-within:ring-2 focus-within:ring-white/40 border-white/40 bg-transparent text-white"
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
            className={`w-full py-3 font-semibold rounded-3xl transition-colors mt-4 ${
              !isFormValid || loading || cooldown > 0
                ? "bg-[#0F75BC]/20 text-white/40 cursor-not-allowed"
                : "bg-[#0F75BC] text-white"
            }`}
            disabled={!isFormValid || loading || cooldown > 0}
          >
            {loading
              ? "Sending..."
              : cooldown > 0
                ? `Please wait ${cooldown}s`
                : "Submit"}
          </motion.button>
        </motion.form>
      </section>

      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3"
        >
          <motion.div
            initial={{ y: 20, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-modal-title"
            className="w-full max-w-md rounded-2xl bg-white/20 backdrop-blur-xs border border-white/40 p-6 text-center shadow-2xl"
          >
            <h2
              id="success-modal-title"
              className="text-2xl font-bold text-white"
            >
              Thank you!
            </h2>
            <p className="mt-3 text-sm text-white">
              Your form was submitted successfully. We appreciate your interest
              and will contact you soon.
            </p>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                router.replace("/agenda");
              }}
              className="mt-6 w-full rounded-full bg-[#0F75BC]/40 px-4 border border-[#0F75BC] py-3 font-semibold uppercase text-white"
            >
              View Agenda
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
