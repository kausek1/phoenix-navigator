import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/contexts/AuthContext";

const roleStyles: Record<UserRole, string> = {
  admin: "bg-primary text-primary-foreground",
  contributor: "bg-accent text-accent-foreground",
  viewer: "bg-muted-foreground/20 text-foreground",
};

const RoleBadge = ({ role }: { role: UserRole }) => (
  <Badge className={`${roleStyles[role]} text-xs capitalize`}>{role}</Badge>
);

export default RoleBadge;
