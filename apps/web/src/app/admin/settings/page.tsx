import type { Metadata } from "next";

import { getAdminSettings, type AdminSettingsResponse } from "../../../lib/admin-api";
import { formatBoolean, formatMoney, formatStatus } from "../admin-format";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Settings | Tiger Ping Pong",
  description: "Protected read-only Tiger Ping Pong safe settings visibility."
};

interface SettingsResource {
  data: AdminSettingsResponse | null;
}

async function loadSettings(): Promise<SettingsResource> {
  try {
    return {
      data: await getAdminSettings()
    };
  } catch {
    return {
      data: null
    };
  }
}

export default async function AdminSettingsPage() {
  const resource = await loadSettings();
  const settings = resource.data?.settings;

  return (
    <div className={styles.pageStack}>
      <section className={styles.pageHeader} aria-labelledby="admin-settings-title">
        <h1 className={styles.title} id="admin-settings-title">
          Settings
        </h1>
      </section>

      <section className={styles.panel} aria-labelledby="admin-settings-list-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="admin-settings-list-title">Safe settings</h2>
          </div>
          <span className={styles.badge}>No secrets shown</span>
        </div>

        {settings ? (
          <dl className={styles.definitionList}>
            <div>
              <dt>Store name</dt>
              <dd>{settings.storeName}</dd>
            </div>
            <div>
              <dt>Support email</dt>
              <dd>{settings.supportEmail}</dd>
            </div>
            <div>
              <dt>Support phone</dt>
              <dd>{settings.supportPhone}</dd>
            </div>
            <div>
              <dt>Currency</dt>
              <dd>{settings.currency}</dd>
            </div>
            <div>
              <dt>Free shipping threshold</dt>
              <dd>{formatMoney(settings.freeShippingThresholdCents, settings.currency)}</dd>
            </div>
            <div>
              <dt>Flat-rate shipping amount</dt>
              <dd>{formatMoney(settings.flatRateShippingCents, settings.currency)}</dd>
            </div>
            {settings.freeShippingException ? (
              <div>
                <dt>Free-shipping product exception</dt>
                <dd>
                  Aqua 4-Pack w/ 3 Balls
                  {settings.freeShippingException.requiresExclusiveCart
                    ? " (only item in cart)"
                    : ""}
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Checkout enabled</dt>
              <dd>{formatBoolean(settings.checkoutEnabled)}</dd>
            </div>
            <div>
              <dt>Stripe mode</dt>
              <dd>{formatStatus(settings.stripeMode)}</dd>
            </div>
          </dl>
        ) : (
          <div className={styles.alert}>
            <p>Settings could not be loaded. Try again.</p>
          </div>
        )}
      </section>
    </div>
  );
}
