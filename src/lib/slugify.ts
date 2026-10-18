export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function fixtureSlug(
  home: string,
  away: string,
  date: string | null | undefined,
) {
  const base = slugify(`${home}-vs-${away}`);
  const day = date?.slice(0, 10) ?? "unknown-date";
  return `${base}-${day}`;
}
