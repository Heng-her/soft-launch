"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import PhoneInput, { type Value as PhoneValue } from "react-phone-number-input";
import "react-phone-number-input/style.css";

type ContactForm = {
    fullName: string;
    email: string;
    phoneNumber: string;
};

type Feedback =
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null;

export default function Contact() {
    const [form, setForm] = useState<ContactForm>({
        fullName: "",
        email: "",
        phoneNumber: "+855",
    });

    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<Feedback>(null);
    const [cooldown, setCooldown] = useState(0);

    const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
            if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        };
    }, []);

    const isFormValid = useMemo(() => {
        return (
            form.fullName.trim() !== "" &&
            form.email.trim() !== "" &&
            form.phoneNumber.trim() !== "" &&
            form.phoneNumber.length > 4
        );
    }, [form.fullName, form.email, form.phoneNumber]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setForm((prev) => (name in prev ? { ...prev, [name]: value } : prev));
    };

    const handlePhoneChange = (value: PhoneValue) => {
        setForm((prev) => ({ ...prev, phoneNumber: (value ?? "+855").toString() }));
    };

    const startCooldown = (seconds: number) => {
        if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);

        setCooldown(seconds);
        cooldownIntervalRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
                    cooldownIntervalRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (cooldown > 0) {
            setFeedback({
                type: "error",
                message: `Please wait ${cooldown} seconds before sending another message.`,
            });
            return;
        }

        setLoading(true);
        setFeedback(null);

        try {
            const response = await fetch("/api/sendmessage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form satisfies ContactForm),
            });

            const data: { error?: string; details?: string } = await response.json().catch(
                () => ({}),
            );

            if (response.ok) {
                setFeedback({ type: "success", message: "Message sent successfully!" });

                setForm({
                    fullName: "",
                    email: "",
                    phoneNumber: "+855",
                });

                startCooldown(30);

                if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
                feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 3000);
                return;
            }

            if (response.status === 429) {
                setFeedback({
                    type: "error",
                    message: data.error || "Too many requests. Please try again later.",
                });
                return;
            }

            setFeedback({
                type: "error",
                message: data.details ? `${data.error || "Something went wrong."} ${data.details}` : data.error || "Something went wrong.",
            });
        } catch {
            setFeedback({ type: "error", message: "Network error, please try again." });
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="w-full bg-white">
            <section
                id="contact"
                className="flex flex-col items-center px-4 py-8 text-center lg:py-16 lg:px-6 bg-background lg:rounded-t-custom rounded-t-custom_phone"
            >
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex items-center justify-center pt-4 text-2xl font-bold text-center lg:pt-6 lg:text-3xl text-foreground"
                >
                    <motion.div
                        className="flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    >
                        <span className="text-2xl lg:text-3xl">⚙️</span>
                    </motion.div>

                    Quick Contact

                    <motion.div
                        className="flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    >
                        <span className="text-2xl lg:text-3xl">⚙️</span>
                    </motion.div>
                </motion.h1>

                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="w-full max-w-lg p-4 mt-4 bg-white shadow-xl lg:p-6 rounded-3xl"
                >
                    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
                        {/* Full Name */}
                        <motion.div whileFocus={{ scale: 1.02 }}>
                            <label className="block text-sm font-semibold text-start text-foreground">
                                Full name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={form.fullName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 mt-2 border rounded-lg outline-none focus:ring-2 focus:ring-black"
                            />
                        </motion.div>

                        {/* Email */}
                        <motion.div whileFocus={{ scale: 1.02 }}>
                            <label className="block text-sm font-semibold text-start text-foreground">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                autoComplete="off"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 mt-2 border rounded-lg outline-none focus:ring-2 focus:ring-black"
                            />
                        </motion.div>
                    </div>

                    {/* Phone */}
                    <motion.div whileFocus={{ scale: 1.02 }} className="mb-4">
                        <label className="block mb-2 text-sm font-semibold text-start text-foreground">
                            Phone number <span className="text-red-500">*</span>
                        </label>

                        <PhoneInput
                            international
                            defaultCountry="KH"
                            value={form.phoneNumber}
                            onChange={handlePhoneChange}
                            className="w-full px-4 py-2 border rounded-lg outline-none focus-within:ring-2 focus-within:ring-black"
                            style={
                                {
                                    "--PhoneInputCountryFlag-borderColor": "transparent",
                                } as React.CSSProperties
                            }
                        />
                    </motion.div>

                    {/* Feedback */}
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className={`my-4 py-3 px-6 text-sm font-semibold rounded-full text-center ${feedback.type === "success"
                                    ? "bg-green-200 text-green-600"
                                    : "bg-red-200 text-red-600"
                                }`}
                        >
                            {feedback.message}
                        </motion.div>
                    )}

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
                        className={`w-full py-3 font-semibold text-white rounded-3xl transition-colors ${!isFormValid || loading || cooldown > 0
                                ? "bg-foreground cursor-not-allowed"
                                : "bg-black/80 hover:bg-black"
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
        </div>
    );
}
