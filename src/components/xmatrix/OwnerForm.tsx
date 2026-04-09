import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Search } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  email?: string;
}

interface OwnerFormProps {
  form: Record<string, any>;
  updateForm: (key: string, value: any) => void;
  profiles: Profile[];
}

const OwnerForm = ({ form, updateForm, profiles }: OwnerFormProps) => {
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = profiles.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selectProfile = (p: Profile) => {
    updateForm("profile_id", p.id);
    updateForm("name", p.full_name);
    updateForm("role_title", p.role || "");
    setSearch(p.full_name);
    setShowResults(false);
  };

  useEffect(() => {
    if (form.profile_id) {
      const p = profiles.find((pr) => pr.id === form.profile_id);
      if (p) setSearch(p.full_name);
    }
  }, [form.profile_id, profiles]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <div className="relative" ref={wrapperRef}>
        <Label>Search existing users</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
        </div>
        {showResults && search && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No users found</div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                  onClick={() => selectProfile(p)}
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{p.full_name}</span>
                  {p.email && <span className="text-muted-foreground text-xs">({p.email})</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div>
        <Label>Name</Label>
        <Input value={form.name || ""} onChange={(e) => updateForm("name", e.target.value)} />
      </div>
      <div>
        <Label>Role Title</Label>
        <Input value={form.role_title || ""} onChange={(e) => updateForm("role_title", e.target.value)} />
      </div>
    </>
  );
};

export default OwnerForm;
