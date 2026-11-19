// Curated web-search source packs. One site, one admin-configured list — there
// is no per-board variant. The chat UI's "Sources in scope" reads the same
// list the admin sets in Organization settings → Artificial intelligence (AI).

export interface WebSourcePack {
  id: string;
  name: string;
  /** Shown next to the checkbox in admin settings. */
  description: string;
  /** Example domains, shown in "Sources in scope" so directors can see what's actually searchable. */
  domains: string[];
}

export const WEB_SOURCE_PACKS: WebSourcePack[] = [
  {
    id: "sec-filings",
    name: "SEC and federal filings",
    description: "10-K, 10-Q, 8-K and proxy filings from EDGAR.",
    domains: ["sec.gov"],
  },
  {
    id: "utility-regulators",
    name: "Utility regulators",
    description: "FERC and state public utility commissions.",
    domains: ["ferc.gov", "cpuc.ca.gov"],
  },
  {
    id: "trade-associations",
    name: "Trade associations",
    description: "Industry bodies, such as the Edison Electric Institute.",
    domains: ["eei.org"],
  },
  {
    id: "benchmarks",
    name: "Financial benchmarks",
    description: "Fund fee and performance benchmarks.",
    domains: ["morningstar.com"],
  },
  {
    id: "news-wires",
    name: "News and press",
    description: "Major newswires and business press.",
    domains: ["reuters.com", "bloomberg.com"],
  },
];

/** On by default, so the feature shows something useful before an admin has configured it. */
export const DEFAULT_SOURCE_PACK_IDS: string[] = ["sec-filings"];

export function packById(id: string): WebSourcePack | undefined {
  return WEB_SOURCE_PACKS.find((p) => p.id === id);
}
