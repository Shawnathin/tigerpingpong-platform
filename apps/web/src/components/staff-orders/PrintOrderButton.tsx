"use client";

import styles from "./order-print.module.css";

export default function PrintOrderButton() {
  return (
    <button className={styles.printButton} type="button" onClick={() => window.print()}>
      Print / Save PDF
    </button>
  );
}
