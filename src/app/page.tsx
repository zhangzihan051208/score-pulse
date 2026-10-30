import { HomeBoards } from "@/components/home-boards";

/** Shell only. Match rows load in the browser so `next build` does not wait on the database. */
export const revalidate = 12;

export default function HomePage() {
  return <HomeBoards />;
}
