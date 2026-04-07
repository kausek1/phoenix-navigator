import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Shield, UserX } from "lucide-react";

const ROLES = ["admin", "contributor", "viewer"];

interface Props { clientId: string; currentUserId: string }

const UsersTab = ({ clientId, currentUserId }: Props) => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  const fetch = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").eq("client_id", clientId);
    setProfiles(data || []);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    const { error } = await supabase.auth.signUp({
      email: inviteEmail,
      password: crypto.randomUUID(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Invite sent to ${inviteEmail}`);
    setInviteOpen(false);
    setInviteEmail("");
  };

  const changeRole = async (profileId: string, newRole: string) => {
    await supabase.from("profiles").update({ role: newRole }).eq("id", profileId);
    toast.success("Role updated");
    fetch();
  };

  const deactivate = async (profileId: string) => {
    await supabase.from("profiles").update({ is_active: false }).eq("id", profileId);
    toast.success("User deactivated");
    fetch();
  };

  const reactivate = async (profileId: string) => {
    await supabase.from("profiles").update({ is_active: true }).eq("id", profileId);
    toast.success("User reactivated");
    fetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Invite User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Email</Label><Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" /></div>
              <div><Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleInvite}>Send Invite</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead>
            <TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((p) => (
            <TableRow key={p.id} className={p.is_active === false ? "opacity-50" : ""}>
              <TableCell className="font-medium">{p.full_name}</TableCell>
              <TableCell>{p.email || "—"}</TableCell>
              <TableCell>
                <Select value={p.role} onValueChange={(v) => changeRole(p.id, v)}>
                  <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {p.is_active === false
                  ? <Badge variant="secondary">Inactive</Badge>
                  : <Badge className="bg-success text-success-foreground">Active</Badge>}
              </TableCell>
              <TableCell className="text-xs">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</TableCell>
              <TableCell>
                {p.id !== currentUserId && (
                  p.is_active === false
                    ? <Button variant="ghost" size="sm" onClick={() => reactivate(p.id)}>Reactivate</Button>
                    : <Button variant="ghost" size="sm" onClick={() => deactivate(p.id)} className="text-destructive"><UserX className="h-4 w-4 mr-1" />Deactivate</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTab;
