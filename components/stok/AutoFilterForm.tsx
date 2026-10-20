"use client";
import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Arama/filtre formu: metin alanlarında yazmayı bırakınca, seçim ve tarih alanlarında
 * değişir değişmez sayfayı yeni filtrelerle günceller. Buton gerekmez.
 */
export default function AutoFilterForm({ children, className, delay = 300 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function apply() {
    clearTimeout(timer.current);
    const form = formRef.current;
    if (!form) return;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim());
    }
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  function onChange(e: React.FormEvent<HTMLFormElement>) {
    const target = e.target as HTMLInputElement;
    const typing = target.tagName === "INPUT" && !["date", "checkbox", "radio"].includes(target.type);
    clearTimeout(timer.current);
    if (typing) timer.current = setTimeout(apply, delay);
    else apply();
  }

  return (
    <form
      ref={formRef}
      className={`${className ?? ""} transition-opacity ${pending ? "opacity-70" : ""}`}
      onChange={onChange}
      onSubmit={(e) => { e.preventDefault(); apply(); }}
    >
      {children}
    </form>
  );
}
