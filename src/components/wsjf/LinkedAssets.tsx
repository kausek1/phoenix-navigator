import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Link2 } from "lucide-react";

interface Props {
  interventionId: string;
  clientId: string;
  canEdit: boolean;
}

const LinkedAssets = ({ interventionId, clientId, canEdit }: Props) => {
  const [links, setLinks] = useState<any[]>([]);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");

  const fetchLinks = useCallback(async () => {
    const { data } = await supabase
      .from("intervention_assets")
      .select("id, asset_id, assets(id, name, asset_type)")
      .eq("intervention_id", interventionId);
    setLinks(data || []);
  }, [interventionId]);

  const fetchAssets = useCallback(async () => {
    const { data } = await supabase
      .from("assets")
      .select("id, name, asset_type")
      .eq("client_id", clientId);
    setAllAssets(data || []);
  }, [clientId]);

  useEffect(() => { fetchLinks(); fetchAssets(); }, [fetchLinks, fetchAssets]);

  const linkedIds = new Set(links.map((l) => l.asset_id));
  const available = allAssets.filter((a) => !linkedIds.has(a.id));

  const handleAdd = async () => {
    if (!selectedAssetId) return;
    await supabase.from("intervention_assets").insert({ intervention_id: interventionId, asset_id: selectedAssetId });
    setSelectedAssetId("");
    fetchLinks();
  };

  const handleRemove = async (linkId: string) => {
    await supabase.from("intervention_assets").delete().eq("id", linkId);
    fetchLinks();
  };

  return (
    <div className="space-y-2">
      <p className="font-semibold text-sm flex items-center gap-1"><Link2 className="h-4 w-4" />Linked Assets</p>
      {links.length === 0 && <p className="text-xs text-muted-foreground">No assets linked.</p>}
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <span key={l.id} className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-xs">
            {l.assets?.name || "Unknown"} <span className="text-muted-foreground">({l.assets?.asset_type})</span>
            {canEdit && (
              <button onClick={() => handleRemove(l.id)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      {canEdit && available.length > 0 && (
        <div className="flex gap-2 items-end">
          <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
            <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Add asset…" /></SelectTrigger>
            <SelectContent>
              {available.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.asset_type})</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleAdd} disabled={!selectedAssetId}>Link</Button>
        </div>
      )}
    </div>
  );
};

export default LinkedAssets;
