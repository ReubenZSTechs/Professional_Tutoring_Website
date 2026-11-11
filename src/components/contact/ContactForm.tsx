"use client";

import { useState, type FormEvent } from "react";

import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { ChatIcon, CheckIcon, MailIcon } from "@/components/ui/Icons";
import { site, whatsappUrl } from "@/config/site";
import type { Dictionary, Lang } from "@/content";
import { sendEnquiry, type EnquiryPayload } from "@/lib/api";

type Status = "idle" | "sending" | "sent" | "error";
type Errors = Partial<Record<"name" | "phone" | "email", string>>;

const fieldClass =
  "min-h-12 w-full rounded-[10px] border border-field bg-card px-3.5 text-base text-ink placeholder:text-placeholder aria-[invalid=true]:border-danger-ink";
const labelClass = "text-sm font-bold text-ink";

export function ContactForm({ t, lang }: { t: Dictionary; lang: Lang }) {
  const f = t.contact.form;
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});

  function validate(payload: EnquiryPayload): Errors {
    const found: Errors = {};
    if (!payload.name) found.name = f.required;
    const digits = payload.phone.replace(/\D/g, "");
    if (!payload.phone) found.phone = f.required;
    else if (digits.length < 6 || !/^\+?[\d\s().-]{6,24}$/.test(payload.phone)) found.phone = f.invalidPhone;
    if (payload.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) found.email = f.invalidEmail;
    return found;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();
    const payload: EnquiryPayload = {
      name: text("name"),
      role: text("role") === "student" ? "student" : "parent",
      subject: text("subject"),
      level: text("level"),
      phone: text("phone"),
      email: text("email"),
      message: text("message"),
      language: lang,
      website: text("website"),
    };

    const found = validate(payload);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      await sendEnquiry(payload);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="flex flex-col items-start gap-3.5 py-6">
        <span aria-hidden="true" className="flex size-[52px] items-center justify-center rounded-full bg-accent text-on-accent">
          <CheckIcon size={26} />
        </span>
        <h3 className="text-[22px] font-extrabold text-ink">{f.sentTitle}</h3>
        <p className="text-base leading-relaxed text-body">{f.sentText}</p>
        <button type="button" onClick={() => setStatus("idle")} className={buttonClass("outline", "md", "mt-1 cursor-pointer")}>
          {f.sendAnother}
        </button>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
      <h3 className="text-xl font-extrabold text-ink">{f.title}</h3>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="f-name" className={labelClass}>
          {f.name}
        </label>
        <input
          id="f-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={100}
          required
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "f-name-error" : undefined}
          className={fieldClass}
        />
        {errors.name ? (
          <p id="f-name-error" className="text-sm font-medium text-danger-ink">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-role" className={labelClass}>
            {f.role}
          </label>
          <select id="f-role" name="role" defaultValue="parent" className={fieldClass}>
            <option value="parent">{f.roles.parent}</option>
            <option value="student">{f.roles.student}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-subject" className={labelClass}>
            {f.subject}
          </label>
          <select id="f-subject" name="subject" className={fieldClass}>
            {f.subjects.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-level" className={labelClass}>
            {f.level}
          </label>
          <select id="f-level" name="level" className={fieldClass}>
            {f.levels.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-phone" className={labelClass}>
            {f.phone}
          </label>
          <input
            id="f-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+62"
            maxLength={24}
            required
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "f-phone-error" : undefined}
            className={fieldClass}
          />
          {errors.phone ? (
            <p id="f-phone-error" className="text-sm font-medium text-danger-ink">
              {errors.phone}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="f-email" className={labelClass}>
          {f.email} <span className="font-medium text-muted">({f.optional})</span>
        </label>
        <input
          id="f-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={120}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "f-email-error" : undefined}
          className={fieldClass}
        />
        {errors.email ? (
          <p id="f-email-error" className="text-sm font-medium text-danger-ink">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="f-message" className={labelClass}>
          {f.message} <span className="font-medium text-muted">({f.optional})</span>
        </label>
        <textarea
          id="f-message"
          name="message"
          rows={4}
          maxLength={2000}
          placeholder={f.messagePlaceholder}
          className={`${fieldClass} resize-y py-3`}
        />
      </div>

      {/* Honeypot: hidden from people, tempting for bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="f-website">Website</label>
        <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status === "error" ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-danger-line bg-danger-bg p-4">
          <p className="text-[15px] font-bold text-danger-ink">{f.errorTitle}</p>
          <p className="text-sm text-danger-ink">{f.errorText}</p>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href={whatsappUrl(t.whatsappMessage)} size="md">
              <ChatIcon size={18} />
              WhatsApp
            </ButtonLink>
            <ButtonLink href={`mailto:${site.email}`} variant="outline" size="md">
              <MailIcon size={18} />
              {t.contact.emailLabel}
            </ButtonLink>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className={buttonClass("primary", "lg", "cursor-pointer disabled:cursor-wait disabled:opacity-70")}
      >
        {sending ? f.sending : f.submit}
      </button>
      <p className="text-[13px] leading-normal text-muted">{f.note}</p>
    </form>
  );
}
