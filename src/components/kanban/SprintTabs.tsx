import { cn } from "@/lib/utils";

interface Sprint {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
}

interface SprintTabsProps {
  sprints: Sprint[];
  selected: string;
  onSelect: (id: string) => void;
}

const formatRange = (start?: string, end?: string) => {
  if (!start && !end) return "";
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
};

const isActive = (s: Sprint) => {
  if (!s.start_date || !s.end_date) return false;
  const now = new Date();
  return new Date(s.start_date) <= now && now <= new Date(s.end_date);
};

const SprintTabs = ({ sprints, selected, onSelect }: SprintTabsProps) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    <button
      onClick={() => onSelect("")}
      className={cn(
        "px-3 py-2 rounded-md text-sm font-medium border transition-colors whitespace-nowrap",
        !selected ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"
      )}
    >
      All
    </button>
    {sprints.map((s) => (
      <button
        key={s.id}
        onClick={() => onSelect(s.id)}
        className={cn(
          "px-3 py-2 rounded-md text-sm border transition-colors whitespace-nowrap flex flex-col items-start",
          selected === s.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted",
          isActive(s) && selected !== s.id && "border-teal-500 border-2"
        )}
      >
        <span className="font-medium">{s.name}</span>
        {(s.start_date || s.end_date) && (
          <span className={cn("text-xs", selected === s.id ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {formatRange(s.start_date, s.end_date)}
          </span>
        )}
      </button>
    ))}
  </div>
);

export default SprintTabs;
