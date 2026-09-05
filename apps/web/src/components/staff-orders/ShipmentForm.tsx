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
import { FREIGHT_CARRIERS, findFreightCarrierByName } from "./freight-carriers";

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
  const initialFreightCarrier = findFreightCarrierByName(shipment.carrier);
  const initialCarrierCode = initialFreightCarrier
    ? "other"
    : shipment.carrier
      ? inferShippingCarrierCode(shipment.carrier)
      : "";
  const [carrierSelection, setCarrierSelection] = useState<string>(
    initialFreightCarrier?.code ?? initialCarrierCode
  );
  const freightCarrier = FREIGHT_CARRIERS.find((carrier) => carrier.code === carrierSelection);
  const carrierCode = freightCarrier ? "other" : (carrierSelection as ShippingCarrierCode | "");
  const [trackingNumber, setTrackingNumber] = useState(shipment.trackingNumber ?? "");
  const [customTrackingUrl, setCustomTrackingUrl] = useState(
    initialCarrierCode === "other" ? (shipment.trackingUrl ?? "") : ""
  );
  const trackingUrl = useMemo(() => {
    if (carrierCode === "other") {
      return customTrackingUrl.trim();
    }

    if (!carrierCode || !trackingNumber.trim()) {
      return "";
    }

    return buildCarrierTrackingUrl(carrierCode, trackingNumber);
  }, [carrierCode, customTrackingUrl, trackingNumber]);

  return (
    <form className={styles.formGrid} action={action}>
      <input type="hidden" name="publicReference" value={publicReference} />
      <input type="hidden" name="carrierCode" value={carrierCode} />
      {freightCarrier && <input type="hidden" name="customCarrier" value={freightCarrier.label} />}
      <label className={styles.field}>
        <span>Carrier</span>
        <select
          name="carrierSelection"
          required
          value={carrierSelection}
          onChange={(event) => {
            setCarrierSelection(event.target.value);
            // A link for the previous carrier must never follow a new carrier selection.
            setCustomTrackingUrl("");
          }}
        >
          <option value="" disabled>
            Select carrier
          </option>
          <optgroup label="Parcel">
            {SHIPPING_CARRIERS.filter((carrier) => carrier.code !== "other").map((carrier) => (
              <option key={carrier.code} value={carrier.code}>
                {carrier.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="LTL / freight">
            {FREIGHT_CARRIERS.map((carrier) => (
              <option key={carrier.code} value={carrier.code}>
                {carrier.label}
              </option>
            ))}
          </optgroup>
          <option value="other">Other carrier</option>
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
          {!freightCarrier && (
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
          )}
          <label className={styles.fieldFull}>
            <span id="tracking-url-label">Tracking URL</span>
            <input
              name="trackingUrl"
              aria-labelledby="tracking-url-label"
              type="url"
              required
              maxLength={1000}
              value={customTrackingUrl}
              onChange={(event) => setCustomTrackingUrl(event.target.value)}
              autoComplete="off"
              aria-describedby={freightCarrier ? "freight-tracking-help" : undefined}
            />
            {freightCarrier && (
              <small id="freight-tracking-help">
                Paste the customer tracking link from Freightcom or the carrier.
              </small>
            )}
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
          <p>Waiting for tracking</p>
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
