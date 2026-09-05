// Staff-selected carrier names, not a rate/booking integration.
// Freightcom's published LTL roster: https://www.freightcom.com/claims (2026-09-04).
// ACE Courier was separately requested by Shawn.
export const FREIGHT_CARRIERS = [
  { code: "ace_courier", label: "ACE Courier" },
  { code: "day_ross", label: "Day & Ross" },
  { code: "ab_courier", label: "A&B Courier" },
  { code: "apex", label: "Apex Motor Express" },
  { code: "cct", label: "CCT" },
  { code: "csa", label: "CSA" },
  { code: "dayton", label: "Dayton Freight" },
  { code: "excel", label: "Excel Transportation" },
  { code: "fastfrate", label: "Fastfrate" },
  { code: "fedex_freight", label: "FedEx Freight" },
  { code: "gardewine", label: "Gardewine North" },
  { code: "gls_freight", label: "GLS Freight" },
  { code: "hi_way_9", label: "Hi-way 9" },
  { code: "kindersley", label: "Kindersley" },
  { code: "manitoulin", label: "Manitoulin Transport" },
  { code: "maritime_ontario", label: "Maritime Ontario" },
  { code: "midland", label: "Midland Transport" },
  { code: "minimax", label: "Minimax" },
  { code: "morneau", label: "Morneau" },
  { code: "overland_west", label: "Overland West" },
  { code: "parallel", label: "Parallel" },
  { code: "polaris", label: "Polaris Transport" },
  { code: "purolator_freight", label: "Purolator Freight" },
  { code: "rl_carriers", label: "R&L Carriers" },
  { code: "tforce_freight", label: "TForce Freight" },
  { code: "transkid", label: "Transkid" },
  { code: "tst_cf", label: "TST-CF Express" },
  { code: "vankam", label: "VanKam" },
  { code: "vitran", label: "Vitran" },
  { code: "western_canada", label: "Western Canada Express" },
  { code: "xpo", label: "XPO" }
] as const;

export function findFreightCarrierByName(name: string | null) {
  const normalized = name?.trim().toLowerCase();
  return FREIGHT_CARRIERS.find((carrier) => carrier.label.toLowerCase() === normalized);
}
