import type { Section } from "@/app/hooks/useSectionRouter";
import { BracketIcon, CalendarIcon, HomeIcon, MicIcon, TableIcon } from "@/app/components/ui/icons";

export function NavIcon({ id }: { id: Section }) {
  if (id === "inicio") return <HomeIcon />;
  if (id === "ranking") return <TableIcon />;
  if (id === "fechas") return <CalendarIcon />;
  if (id === "batallas") return <BracketIcon />;
  return <MicIcon />;
}
