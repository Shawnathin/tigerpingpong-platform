"use client";

import {
  SHIPPING_CARRIERS,
  buildCarrierTrackingUrl,
  inferShippingCarrierCode,
  type ShippingCarrierCode
} from "@tigerpingpong/shared";
import { useMemo, useState } from "react";

import type { InternalOrderShipment } from "../../lib/internal-orders-api";

import styles from "./staff-orders.module.css";

interface ShipmentFormProps {
  action: (formData: FormData) => Promise<void>;
  publicReference: string;
  shippedDate: string;
  shipment: InternalOrderShipment;
}

export default function ShipmentForm({
  action,
  publicReference,
  shippedDate,
  shipment
}: ShipmentFormProps) {
  const initialCarrierCode = inferShippingCarrierCode(shipment.carrier);
  const [carrierCode, setCarrierCode] = useState<ShippingCarrierCode>(initialCarrierCode);
  const [trackingNumber, setTrackingNumber] = useState(shipment.trackingNumber ?? "");
  const [customTrackingUrl, setCustomTrackingUrl] = useState(
    initialCarrierCode === "other" ? (shipment.trackingUrl ?? "") : ""
  );
  const trackingUrl = useMemo(() => {
    if (carrierCode === "other") {
      return customTrackingUrl.trim();
    }

    if (!trackingNumber.trim()) {
      return "";
    }

    return buildCarrierTrackingUrl(carrierCode, trackingNumber);
  }, [carrierCode, customTrackingUrl, trackingNumber]);

  return (
    <form className={styles.formGrid} action={action}>
      <input type="hidden" name="publicReference" value={publicReference} />
      <label className={styles.field}>
        <span>Carrier</span>
        <select
          name="carrierCode"
          required
          value={carrierCode}
          onChange={(event) => setCarrierCode(event.target.value as ShippingCarrierCode)}
        >
          {SHIPPING_CARRIERS.map((carrier) => (
            <option key={carrier.code} value={carrier.code}>
              {carrier.label}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span>Tracking number</span>
        <input
          name="trackingNumber"
          required
          maxLength={500}
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
          autoComplete="off"
        />
      </label>
      {carrierCode === "other" ? (
        <>
          <label className={styles.field}>
            <span>Carrier name</span>
            <input
              name="customCarrier"
              required
              maxLength={500}
              defaultValue={initialCarrierCode === "other" ? (shipment.carrier ?? "") : ""}
              autoComplete="off"
            />
          </label>
          <label className={styles.fieldFull}>
            <span>Tracking URL</span>
            <input
              name="trackingUrl"
              type="url"
              required
              maxLength={1000}
              value={customTrackingUrl}
              onChange={(event) => setCustomTrackingUrl(event.target.value)}
              autoComplete="off"
            />
          </label>
        </>
      ) : (
        <input type="hidden" name="trackingUrl" value={trackingUrl} />
      )}
      <div className={styles.fieldFull} aria-live="polite">
        <span>Customer tracking link</span>
        {trackingUrl ? (
          <a className={styles.link} href={trackingUrl} target="_blank" rel="noreferrer">
            {trackingUrl}
          </a>
        ) : (
          <p>Enter a tracking number to build the link.</p>
        )}
      </div>
      <label className={styles.field}>
        <span>Shipped date (Vancouver)</span>
        <input name="shippedDate" type="date" required defaultValue={shippedDate} />
      </label>
      <label className={styles.fieldFull}>
        <span>Internal note</span>
        <textarea
          name="internalNote"
          required
          maxLength={2000}
          rows={4}
          defaultValue={shipment.internalNote ?? "Shipment recorded by staff."}
        />
      </label>
      <div className={styles.formActions}>
        <button className={styles.button} type="submit">
          Save and email tracking
        </button>
      </div>
    </form>
  );
}
