import { deepMerge } from "@/lib/deep-merge";
import { deOverrides } from "@/i18n/de-overrides";
import type { Dict } from "@/i18n/dict";
import en from "./en";

const de: Dict = deepMerge(en, deOverrides as unknown as Partial<Dict>);

export default de;
