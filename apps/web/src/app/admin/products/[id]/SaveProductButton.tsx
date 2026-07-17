"use client";

import { useFormStatus } from "react-dom";

import styles from "../../admin.module.css";

export function SaveProductButton() {
  const { pending } = useFormStatus();

  return (
    <button aria-busy={pending} className={styles.primaryButton} disabled={pending} type="submit">
      {pending ? "Saving…" : "Save product"}
    </button>
  );
}
