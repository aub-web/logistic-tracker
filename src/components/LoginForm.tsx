"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { loginAdmin } from "@/lib/actions/admin-auth-actions";

export default function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAdmin(name, pin);
      if ("error" in result) {
        setError(result.error);
        setPin("");
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="sr-only">
          Your name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          autoFocus
          required
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-4 py-3.5 text-center text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

      <div>
        <label htmlFor="pin" className="sr-only">
          Admin PIN
        </label>
        <input
          id="pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          required
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 px-4 py-3.5 text-center text-lg tracking-[0.3em] text-zinc-900 placeholder:tracking-normal placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-[#14293D] px-4 py-3.5 text-base font-medium text-white transition hover:bg-[#0e1e2c] disabled:opacity-50"
      >
        {isPending ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
