"use client";
import { createContext, startTransition, useActionState, useContext, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ActionState } from "@/lib/stok/server";
import { Notice, btnPrimary } from "@/components/stok/ui";

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

const PendingContext = createContext(false);

export function SubmitButton({ children, className = btnPrimary, name, value }: {
  children: React.ReactNode; className?: string; name?: string; value?: string;
}) {
  const { pending } = useFormStatus();
  const busy = useContext(PendingContext) || pending;
  return (
    <button type="submit" disabled={busy} className={className} name={name} value={value}>
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

/**
 * Server Action'a bağlı form: hata/başarı mesajını gösterir; benzer kayıt uyarısında
 * "Yine de kaydet" onayını sunar.
 */
export default function ActionForm({
  action, children, submitLabel, className = "space-y-5", resetOnSuccess = false, encType, confirmText,
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel?: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  encType?: "multipart/form-data";
  confirmText?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: ActionState, form: FormData) => {
    const next = await action(prev, form);
    if (next?.ok && resetOnSuccess) formRef.current?.reset();
    return next;
  }, undefined);

  // `action` prop'u yerine elle gönderilir: React form action'ları her gönderimden sonra
  // formu sıfırlar ve hata durumunda kullanıcının girdiği değerler kaybolur.
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || (confirmText && !confirm(confirmText))) return;
    const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => formAction(data));
  }

  return (
    <PendingContext.Provider value={pending}>
    <form ref={formRef} onSubmit={submit} className={className} encType={encType}>
      {state?.error && (
        <Notice tone={state.needsConfirm ? "yellow" : "red"}>
          {state.error}
          {state.needsConfirm && (
            <div className="mt-3">
              <SubmitButton name="confirmDuplicate" value="yes" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-3 py-1.5 rounded-lg text-xs">
                Yine de kaydet
              </SubmitButton>
            </div>
          )}
        </Notice>
      )}
      {state?.ok && <Notice tone="green">{state.ok}</Notice>}
      {children}
      {submitLabel && (
        <div className="flex justify-end">
          <SubmitButton>{submitLabel}</SubmitButton>
        </div>
      )}
    </form>
    </PendingContext.Provider>
  );
}

/** Tek tıkla çalışan işlem butonu (pasife al, iptal et…); isteğe bağlı onay sorusu. */
export function ActionButton({
  action, children, confirmText, className,
}: {
  action: () => Promise<void>;
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => { if (confirmText && !confirm(confirmText)) e.preventDefault(); }}
    >
      <SubmitButton className={className}>{children}</SubmitButton>
    </form>
  );
}
