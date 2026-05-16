export interface Apparatus {
  slug: string;
  label: string;
}

export const APPARATUSES: Apparatus[] = [
  { slug: "top", label: "Top" },
  { slug: "labut", label: "Labut" },
  { slug: "ip", label: "İp" },
  { slug: "kurdele", label: "Kurdele" },
  { slug: "cember", label: "Çember" },
  { slug: "serbest", label: "Serbest" },
];

const SLUG_TO_LABEL = new Map(APPARATUSES.map((a) => [a.slug, a.label]));

export const getApparatusLabel = (slug: string): string =>
  SLUG_TO_LABEL.get(slug) ?? slug;
