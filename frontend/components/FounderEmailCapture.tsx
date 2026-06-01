"use client";

import { useRef, useState } from "react";
import { Button, Input } from "@heroui/react";
import posthog from "posthog-js";

interface Props {
	defaultEmail?: string;
	onSubmitted?: () => void;
}

export default function FounderEmailCapture({ defaultEmail = "", onSubmitted }: Props) {
	const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
	const [email, setEmail] = useState(defaultEmail);
	const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
	const [invalid, setInvalid] = useState(false);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const value = email.trim();
		if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
			setInvalid(true);
			inputRef.current?.focus();
			return;
		}
		setInvalid(false);
		setState("submitting");
		try {
			const res = await fetch(`${apiUrl}/api/email-signup`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: value })
			});
			if (res.ok) {
				setState("success");
				posthog.capture("founder_email_capture", {
					surface: "onboarding_step4a_done",
					success: true
				});
				onSubmitted?.();
			} else {
				setState("error");
				posthog.capture("founder_email_capture", {
					surface: "onboarding_step4a_done",
					success: false
				});
			}
		} catch {
			setState("error");
			posthog.capture("founder_email_capture", {
				surface: "onboarding_step4a_done",
				success: false
			});
		}
	};

	if (state === "success") {
		return (
			<div className="rounded-xl border-2 border-primary/40 bg-primary/5 dark:bg-primary/10 p-5 text-center">
				<div className="text-3xl mb-2">✓</div>
				<p className="font-semibold text-foreground">Thanks — I&apos;ll be in touch</p>
				<p className="text-sm text-foreground/70 mt-1">Lianna, founder of JustAJobApp</p>
			</div>
		);
	}

	return (
		<div className="rounded-xl border-2 border-primary/40 bg-primary/5 dark:bg-primary/10 p-5">
			<h2 className="text-lg font-bold text-foreground mb-2">Help me help your job search</h2>
			<p className="text-sm text-foreground/80 mb-4 leading-relaxed">
				Hi! I&apos;m Lianna, the gal building JustAJobApp. My mission is to save you from spreadsheet hell.
				<br /> 😈 <br />
				Real human feedback can never be automated, so can I email you to ask awkward questions sometimes? 🥺
				👉👈
			</p>
			<form className="flex flex-col sm:flex-row gap-2" onSubmit={handleSubmit}>
				<Input
					ref={inputRef}
					aria-label="Email address"
					className="flex-grow dark:focus:text-gray-800"
					errorMessage={invalid ? "Please enter a valid email address" : undefined}
					isDisabled={state === "submitting"}
					isInvalid={invalid}
					placeholder="you@email.com"
					type="email"
					value={email}
					onValueChange={(v) => {
						setEmail(v);
						if (invalid) setInvalid(false);
						if (state === "error") setState("idle");
					}}
				/>
				<Button color="primary" isLoading={state === "submitting"} type="submit">
					Email me
				</Button>
			</form>
			<p className="text-xs text-foreground/60 mt-2">Occasional emails for feedback and new feature updates.</p>
			{state === "error" && <p className="text-xs text-danger mt-2">Hmm — that didn&apos;t work. Try again?</p>}
		</div>
	);
}
