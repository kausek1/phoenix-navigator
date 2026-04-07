import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const INDUSTRIES = [
  "Commercial Real Estate", "Residential Real Estate", "Healthcare",
  "Education", "Hospitality", "Retail", "Industrial", "Government",
  "Financial Services", "Technology", "Energy", "Other",
];

const STAGES = ["scoping", "business_case", "funded", "in_delivery", "commissioned", "verified"];
const STAGE_LABELS: Record<string, string> = {
  scoping: "Scoping", business_case: "Business Case", funded: "Funded",
  in_delivery: "In Delivery", commissioned: "Commissioned", verified: "Verified",
};

interface Props { clientId: string }

const ClientProfileTab = ({ clientId }: Props) => {
  const [client, setClient] = useState<any>(null);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [wipLimits, setWipLimits] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);

  const fetch = useCallback(async () => {
    const { data: c } = await supabase.from("clients").select("*").eq("id", clientId).single();
    if (c) {
      setClient(c);
      setName(c.name || "");
      setIndustry(c.industry || "");
      setLogoUrl(c.logo_url || "");
    }
    const { data: wip } = await supabase.from("kanban_wip_limits").select("*").eq("client_id", clientId);
    const m: Record<string, number> = {};
    (wip || []).forEach((w: any) => { m[w.stage] = w.wip_limit; });
    setWipLimits(m);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const saveClient = async () => {
    await supabase.from("clients").update({ name, industry, logo_url: logoUrl }).eq("id", clientId);
    toast.success("Client updated");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `logos/${clientId}/${file.name}`;
    const { error } = await supabase.storage.from("client-assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("client-assets").getPublicUrl(path);
    setLogoUrl(urlData.publicUrl);
    await supabase.from("clients").update({ logo_url: urlData.publicUrl }).eq("id", clientId);
    toast.success("Logo uploaded");
    setUploading(false);
  };

  const saveWip = async (stage: string, limit: number) => {
    const existing = await supabase.from("kanban_wip_limits").select("id").eq("client_id", clientId).eq("stage", stage).single();
    if (existing.data) {
      await supabase.from("kanban_wip_limits").update({ wip_limit: limit }).eq("id", existing.data.id);
    } else {
      await supabase.from("kanban_wip_limits").insert({ client_id: clientId, stage, wip_limit: limit });
    }
    setWipLimits((prev) => ({ ...prev, [stage]: limit }));
    toast.success(`WIP limit for ${STAGE_LABELS[stage]} set to ${limit}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Client Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Client Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Industry Sector</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {logoUrl && <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded border" />}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <span><Upload className="h-4 w-4 mr-1" />{uploading ? "Uploading…" : "Upload Logo"}</span>
                </Button>
              </label>
            </div>
          </div>
          <Button onClick={saveClient}>Save Client Details</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">WIP Limits</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {STAGES.map((stage) => (
              <div key={stage}>
                <Label>{STAGE_LABELS[stage]}</Label>
                <Input
                  type="number"
                  min={0}
                  value={wipLimits[stage] || ""}
                  placeholder="No limit"
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0) saveWip(stage, val);
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientProfileTab;
