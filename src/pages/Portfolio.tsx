import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import SlideOverPanel from "@/components/SlideOverPanel";
import ConfirmDialog from "@/components/ConfirmDialog";
import CsvImport from "@/components/portfolio/CsvImport";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Building2, Leaf, Zap, Target, TrendingDown, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const SCOPES = ["scope_1", "scope_2", "scope_3"];
const METHODOLOGIES = ["SBTi_1_5C", "SBTi_WB2C", "Paris_aligned", "CRREM", "GRESB", "RE100", "Internal", "Other"];
const FUEL_COLORS = ["#1B4F72", "#0E7A65", "#2C3E50", "#D97706", "#16A34A", "#DC2626", "#7C3AED", "#EC4899"];

const SCOPE_3_CATEGORIES = [
  { value: "cat_1", label: "Cat 1: Purchased Goods & Services" },
  { value: "cat_2", label: "Cat 2: Capital Goods" },
  { value: "cat_3", label: "Cat 3: Fuel & Energy Related Activities" },
  { value: "cat_4", label: "Cat 4: Upstream Transportation & Distribution" },
  { value: "cat_5", label: "Cat 5: Waste Generated in Operations" },
  { value: "cat_6", label: "Cat 6: Business Travel" },
  { value: "cat_7", label: "Cat 7: Employee Commuting" },
  { value: "cat_8", label: "Cat 8: Upstream Leased Assets" },
  { value: "cat_9", label: "Cat 9: Downstream Transportation & Distribution" },
  { value: "cat_10", label: "Cat 10: Processing of Sold Products" },
  { value: "cat_11", label: "Cat 11: Use of Sold Products" },
  { value: "cat_12", label: "Cat 12: End-of-Life Treatment of Sold Products" },
  { value: "cat_13", label: "Cat 13: Downstream Leased Assets" },
  { value: "cat_14", label: "Cat 14: Franchises" },
  { value: "cat_15", label: "Cat 15: Investments" },
  { value: "cat_16", label: "Cat 16: Other" },
];

const Portfolio = () => {
  const { clientId, canEdit, canDelete } = useAuth();
  const [view, setView] = useState<"assets" | "dashboard">("assets");

  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetSlideOpen, setAssetSlideOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [assetForm, setAssetForm] = useState<Record<string, any>>({});
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);

  const [emissions, setEmissions] = useState<any[]>([]);
  const [emissionSlideOpen, setEmissionSlideOpen] = useState(false);
  const [editEmission, setEditEmission] = useState<any>(null);
  const [emissionForm, setEmissionForm] = useState<Record<string, any>>({});
  const [deleteEmissionId, setDeleteEmissionId] = useState<string | null>(null);

  const [energy, setEnergy] = useState<any[]>([]);
  const [energySlideOpen, setEnergySlideOpen] = useState(false);
  const [editEnergy, setEditEnergy] = useState<any>(null);
  const [energyForm, setEnergyForm] = useState<Record<string, any>>({});
  const [deleteEnergyId, setDeleteEnergyId] = useState<string | null>(null);

  const [targets, setTargets] = useState<any[]>([]);
  const [targetSlideOpen, setTargetSlideOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [targetForm, setTargetForm] = useState<Record<string, any>>({});
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [interventions, setInterventions] = useState<any[]>([]);

  const fetchAssets = useCallback(async () => {
    if (!clientId) return;
    const { data } = await supabase.from("assets").select("*").eq("client_id", clientId);
    setAssets(data || []);
  }, [clientId]);

  const fetchEmissions = useCallback(async () => {
    if (!clientId) return;
    const { data } = await supabase.from("emissions").select("*");
    setEmissions(data || []);
  }, [clientId]);

  const fetchEnergy = useCallback(async () => {
    if (!clientId) return;
    const { data } = await supabase.from("energy_consumption").select("*");
    setEnergy(data || []);
  }, [clientId]);

  const fetchTargets = useCallback(async () => {
    if (!clientId) return;
    const { data } = await supabase.from("reduction_targets").select("*").eq("client_id", clientId);
    setTargets(data || []);
  }, [clientId]);

  const fetchInterventions = useCallback(async () => {
    if (!clientId) return;
    const { data } = await supabase.from("interventions").select("id, title, business_roi, planet_impact, people_impact, time_to_deploy, asset_id").eq("client_id", clientId);
    setInterventions(data || []);
  }, [clientId]);

  useEffect(() => {
    fetchAssets(); fetchEmissions(); fetchEnergy(); fetchTargets(); fetchInterventions();
  }, [fetchAssets, fetchEmissions, fetchEnergy, fetchTargets, fetchInterventions]);

  // CRUD handlers
  const openAddAsset = () => { setEditAsset(null); setAssetForm({}); setAssetSlideOpen(true); };
  const openEditAsset = (a: any) => { setEditAsset(a); setAssetForm({ ...a }); setAssetSlideOpen(true); };
  const saveAsset = async () => {
    if (editAsset) await supabase.from("assets").update(assetForm).eq("id", editAsset.id);
    else await supabase.from("assets").insert({ ...assetForm, client_id: clientId });
    setAssetSlideOpen(false); fetchAssets();
  };
  const deleteAsset = async () => { if (deleteAssetId) await supabase.from("assets").delete().eq("id", deleteAssetId); setDeleteAssetId(null); fetchAssets(); };

  const openAddEmission = () => { setEditEmission(null); setEmissionForm({ asset_id: selectedAsset?.id }); setEmissionSlideOpen(true); };
  const openEditEmission = (e: any) => { setEditEmission(e); setEmissionForm({ ...e }); setEmissionSlideOpen(true); };
  const saveEmission = async () => {
    const payload = { ...emissionForm };
    if (payload.scope !== "scope_3") delete payload.scope_3_category;
    if (editEmission) await supabase.from("emissions").update(payload).eq("id", editEmission.id);
    else await supabase.from("emissions").insert(payload);
    setEmissionSlideOpen(false); fetchEmissions();
  };
  const deleteEmission = async () => { if (deleteEmissionId) await supabase.from("emissions").delete().eq("id", deleteEmissionId); setDeleteEmissionId(null); fetchEmissions(); };

  const openAddEnergy = () => { setEditEnergy(null); setEnergyForm({ asset_id: selectedAsset?.id }); setEnergySlideOpen(true); };
  const openEditEnergy = (e: any) => { setEditEnergy(e); setEnergyForm({ ...e }); setEnergySlideOpen(true); };
  const saveEnergy = async () => {
    if (editEnergy) await supabase.from("energy_consumption").update(energyForm).eq("id", editEnergy.id);
    else await supabase.from("energy_consumption").insert(energyForm);
    setEnergySlideOpen(false); fetchEnergy();
  };
  const deleteEnergy = async () => { if (deleteEnergyId) await supabase.from("energy_consumption").delete().eq("id", deleteEnergyId); setDeleteEnergyId(null); fetchEnergy(); };

  const openAddTarget = () => { setEditTarget(null); setTargetForm({}); setTargetSlideOpen(true); };
  const openEditTarget = (t: any) => { setEditTarget(t); setTargetForm({ ...t }); setTargetSlideOpen(true); };
  const saveTarget = async () => {
    const payload = { ...targetForm };
    if (payload.methodology !== "SBTi_1_5C" && payload.methodology !== "SBTi_WB2C") {
      delete payload.sbti_approved; delete payload.sbti_approval_date;
    }
    if (!payload.sbti_approved) delete payload.sbti_approval_date;
    if (editTarget) await supabase.from("reduction_targets").update(payload).eq("id", editTarget.id);
    else await supabase.from("reduction_targets").insert({ ...payload, client_id: clientId });
    setTargetSlideOpen(false); fetchTargets();
  };
  const deleteTarget = async () => { if (deleteTargetId) await supabase.from("reduction_targets").delete().eq("id", deleteTargetId); setDeleteTargetId(null); fetchTargets(); };

  // Dashboard calculations
  const assetIds = assets.map((a) => a.id);
  const assetEmissions = emissions.filter((e) => assetIds.includes(e.asset_id));
  const latestYear = Math.max(...assetEmissions.map((e) => e.reporting_year || 0), 0);
  const thisYearEmissions = assetEmissions.filter((e) => e.reporting_year === latestYear);
  const prevYearEmissions = assetEmissions.filter((e) => e.reporting_year === latestYear - 1);
  const totalThisYear = thisYearEmissions.reduce((s, e) => s + (Number(e.co2e_tonnes) || 0), 0);
  const totalPrevYear = prevYearEmissions.reduce((s, e) => s + (Number(e.co2e_tonnes) || 0), 0);
  const yoyChange = totalPrevYear > 0 ? ((totalThisYear - totalPrevYear) / totalPrevYear) * 100 : 0;
  const totalFloorArea = assets.reduce((s, a) => s + (Number(a.gross_floor_area_m2) || 0), 0);

  // Emissions Intensity
  const intensity = totalFloorArea > 0 ? totalThisYear / totalFloorArea : 0;
  const prevIntensity = totalFloorArea > 0 && totalPrevYear > 0 ? totalPrevYear / totalFloorArea : 0;
  const intensityChange = prevIntensity > 0 ? ((intensity - prevIntensity) / prevIntensity) * 100 : 0;

  // Traffic light for targets
  const getTargetStatus = (t: any) => {
    if (!t.baseline_year || !t.target_year || !t.baseline_co2e || !t.target_reduction_pct) return null;
    const targetCo2e = t.baseline_co2e * (1 - t.target_reduction_pct / 100);
    const totalYears = t.target_year - t.baseline_year;
    if (totalYears <= 0) return null;
    const elapsed = latestYear - t.baseline_year;
    if (elapsed <= 0) return null;
    // Linear interpolation: expected emissions at latestYear
    const expectedAtLatest = t.baseline_co2e - ((t.baseline_co2e - targetCo2e) * (elapsed / totalYears));
    // Actual emissions for this scope in latestYear
    const actualForScope = thisYearEmissions
      .filter((e) => e.scope === t.scope)
      .reduce((s, e) => s + (Number(e.co2e_tonnes) || 0), 0);
    if (actualForScope <= expectedAtLatest) return "on_track";
    if (actualForScope <= expectedAtLatest * 1.1) return "at_risk";
    return "off_track";
  };

  const trafficLight = (status: string | null) => {
    if (status === "on_track") return <Badge className="bg-green-500 text-white">On Track</Badge>;
    if (status === "at_risk") return <Badge className="bg-amber-500 text-white">At Risk</Badge>;
    if (status === "off_track") return <Badge className="bg-red-500 text-white">Off Track</Badge>;
    return <Badge variant="secondary">N/A</Badge>;
  };

  // Chart data
  const emissionsByScope = useMemo(() => {
    const yearMap: Record<number, Record<string, number>> = {};
    assetEmissions.forEach((e) => {
      const yr = e.reporting_year;
      if (!yr) return;
      if (!yearMap[yr]) yearMap[yr] = { year: yr, scope_1: 0, scope_2: 0, scope_3: 0 } as any;
      yearMap[yr][e.scope || "scope_1"] = (yearMap[yr][e.scope || "scope_1"] || 0) + (Number(e.co2e_tonnes) || 0);
    });
    return Object.values(yearMap).sort((a: any, b: any) => a.year - b.year);
  }, [assetEmissions]);

  const emissionsByAsset = useMemo(() => {
    return assets.map((a) => ({
      name: a.name,
      tCO2e: assetEmissions.filter((e) => e.asset_id === a.id).reduce((s, e) => s + (Number(e.co2e_tonnes) || 0), 0),
    })).sort((a, b) => b.tCO2e - a.tCO2e);
  }, [assets, assetEmissions]);

  const energyByFuel = useMemo(() => {
    const fuelMap: Record<string, number> = {};
    energy.filter((e) => assetIds.includes(e.asset_id)).forEach((e) => {
      fuelMap[e.fuel_type || "Unknown"] = (fuelMap[e.fuel_type || "Unknown"] || 0) + (Number(e.quantity) || 0);
    });
    return Object.entries(fuelMap).map(([name, value]) => ({ name, value }));
  }, [energy, assetIds]);

  const updateAssetForm = (k: string, v: any) => setAssetForm((f) => ({ ...f, [k]: v }));
  const updateEmissionForm = (k: string, v: any) => setEmissionForm((f) => ({ ...f, [k]: v }));
  const updateEnergyForm = (k: string, v: any) => setEnergyForm((f) => ({ ...f, [k]: v }));
  const updateTargetForm = (k: string, v: any) => setTargetForm((f) => ({ ...f, [k]: v }));

  const calcWSJF = (r: any) => ((Number(r.business_roi) || 0) + (Number(r.planet_impact) || 0) + (Number(r.people_impact) || 0)) / (Number(r.time_to_deploy) || 1);

  const isSBTi = targetForm.methodology === "SBTi_1_5C" || targetForm.methodology === "SBTi_WB2C";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Portfolio & Emissions</h1>

      <Tabs value={view} onValueChange={(v) => { setView(v as any); setSelectedAsset(null); }}>
        <TabsList>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          {selectedAsset ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAsset(null)}>← Back to Assets</Button>
                  <h2 className="text-xl font-semibold text-foreground mt-2">{selectedAsset.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedAsset.city}, {selectedAsset.country} · {selectedAsset.asset_type} · {selectedAsset.gross_floor_area_m2} m²</p>
                </div>
              </div>

              {/* Energy */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Zap className="h-4 w-4 text-warning" />Energy Consumption</CardTitle>
                  <div className="flex gap-2">
                    <CsvImport assets={assets} onImported={fetchEnergy} />
                    {canEdit && <Button size="sm" onClick={openAddEnergy}><Plus className="h-4 w-4 mr-1" />Add</Button>}
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Fuel Type</TableHead><TableHead>Period Start</TableHead><TableHead>Period End</TableHead><TableHead>Quantity</TableHead><TableHead>Unit</TableHead><TableHead>Cost</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {energy.filter((e) => e.asset_id === selectedAsset.id).map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>{e.fuel_type}</TableCell><TableCell>{e.period_start}</TableCell><TableCell>{e.period_end}</TableCell>
                          <TableCell>{e.quantity}</TableCell><TableCell>{e.unit}</TableCell><TableCell>{e.cost ? `$${Number(e.cost).toLocaleString()}` : "—"}</TableCell>
                          <TableCell className="flex gap-1">
                            {canEdit && <Button variant="ghost" size="icon" onClick={() => openEditEnergy(e)}><Pencil className="h-4 w-4" /></Button>}
                            {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteEnergyId(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Emissions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Leaf className="h-4 w-4 text-success" />Emissions</CardTitle>
                  {canEdit && <Button size="sm" onClick={openAddEmission}><Plus className="h-4 w-4 mr-1" />Add</Button>}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Scope</TableHead><TableHead>Category</TableHead><TableHead>Year</TableHead><TableHead>tCO₂e</TableHead><TableHead>Factor</TableHead><TableHead>Source</TableHead><TableHead>Verified</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {emissions.filter((e) => e.asset_id === selectedAsset.id).map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>{e.scope}</TableCell>
                          <TableCell>{e.scope === "scope_3" ? (SCOPE_3_CATEGORIES.find((c) => c.value === e.scope_3_category)?.label || e.scope_3_category) : "—"}</TableCell>
                          <TableCell>{e.reporting_year}</TableCell><TableCell>{e.co2e_tonnes}</TableCell>
                          <TableCell>{e.emission_factor}</TableCell><TableCell>{e.source}</TableCell>
                          <TableCell>{e.verified ? <Badge className="bg-success text-success-foreground">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                          <TableCell className="flex gap-1">
                            {canEdit && <Button variant="ghost" size="icon" onClick={() => openEditEmission(e)}><Pencil className="h-4 w-4" /></Button>}
                            {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteEmissionId(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Linked Interventions */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Linked Interventions</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>WSJF Score</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {interventions.filter((i) => i.asset_id === selectedAsset.id).map((i) => (
                        <TableRow key={i.id}>
                          <TableCell>{i.title}</TableCell>
                          <TableCell><Badge className="bg-primary text-primary-foreground">{calcWSJF(i).toFixed(2)}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Assets</CardTitle>
                {canEdit && <Button size="sm" onClick={openAddAsset}><Plus className="h-4 w-4 mr-1" />Add Asset</Button>}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Location</TableHead><TableHead>GFA (m²)</TableHead>
                      <TableHead>Year Built</TableHead><TableHead>Certification</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((a) => (
                      <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedAsset(a)}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>{a.asset_type}</TableCell>
                        <TableCell>{a.city}, {a.country}</TableCell>
                        <TableCell>{a.gross_floor_area_m2?.toLocaleString()}</TableCell>
                        <TableCell>{a.year_built}</TableCell>
                        <TableCell>{a.certification || "—"}</TableCell>
                        <TableCell><Badge variant="secondary">{a.status || "active"}</Badge></TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} className="flex gap-1">
                          {canEdit && <Button variant="ghost" size="icon" onClick={() => openEditAsset(a)}><Pencil className="h-4 w-4" /></Button>}
                          {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteAssetId(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dashboard">
          {/* Summary cards — 6 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Building2 className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{assets.length}</p><p className="text-xs text-muted-foreground">Total Assets</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Target className="h-8 w-8 text-accent" /><div><p className="text-2xl font-bold">{totalFloorArea.toLocaleString()} m²</p><p className="text-xs text-muted-foreground">Total Floor Area</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Leaf className="h-8 w-8 text-success" /><div><p className="text-2xl font-bold">{totalThisYear.toLocaleString()} tCO₂e</p><p className="text-xs text-muted-foreground">Emissions ({latestYear || "—"})</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3">
              {yoyChange <= 0 ? <ArrowDown className="h-8 w-8 text-success" /> : <ArrowUp className="h-8 w-8 text-destructive" />}
              <div><p className="text-2xl font-bold">{yoyChange.toFixed(1)}%</p><p className="text-xs text-muted-foreground">YoY Change</p></div>
            </div></CardContent></Card>
            {/* NEW: Emissions Intensity */}
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Activity className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{intensity > 0 ? intensity.toFixed(3) : "—"}</p><p className="text-xs text-muted-foreground">tCO₂e / m²</p></div></div></CardContent></Card>
            {/* NEW: YoY Intensity Change */}
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3">
              {intensityChange <= 0 ? <TrendingDown className="h-8 w-8 text-success" /> : <ArrowUp className="h-8 w-8 text-destructive" />}
              <div><p className="text-2xl font-bold">{prevIntensity > 0 ? `${intensityChange.toFixed(1)}%` : "—"}</p><p className="text-xs text-muted-foreground">Intensity YoY</p></div>
            </div></CardContent></Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card><CardHeader><CardTitle className="text-sm">Total Emissions by Scope</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={emissionsByScope as any}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis /><Tooltip /><Legend />
                  <Bar dataKey="scope_1" stackId="a" fill="#1B4F72" name="Scope 1" />
                  <Bar dataKey="scope_2" stackId="a" fill="#0E7A65" name="Scope 2" />
                  <Bar dataKey="scope_3" stackId="a" fill="#2C3E50" name="Scope 3" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent></Card>

            <Card><CardHeader><CardTitle className="text-sm">Emissions by Asset</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={emissionsByAsset} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={120} />
                  <Tooltip /><Bar dataKey="tCO2e" fill="#0E7A65" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent></Card>

            <Card><CardHeader><CardTitle className="text-sm">Progress vs Reduction Targets</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={emissionsByScope as any}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis /><Tooltip /><Legend />
                  <Line type="monotone" dataKey="scope_1" stroke="#1B4F72" name="Scope 1 Actual" />
                  <Line type="monotone" dataKey="scope_2" stroke="#0E7A65" name="Scope 2 Actual" />
                  <Line type="monotone" dataKey="scope_3" stroke="#2C3E50" name="Scope 3 Actual" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent></Card>

            <Card><CardHeader><CardTitle className="text-sm">Energy by Fuel Type</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={energyByFuel} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                    {energyByFuel.map((_, i) => <Cell key={i} fill={FUEL_COLORS[i % FUEL_COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent></Card>
          </div>

          {/* Reduction Targets with Traffic Lights */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Reduction Targets</CardTitle>
              {canEdit && <Button size="sm" onClick={openAddTarget}><Plus className="h-4 w-4 mr-1" />Add Target</Button>}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scope</TableHead><TableHead>Baseline Year</TableHead><TableHead>Baseline tCO₂e</TableHead>
                    <TableHead>Target Year</TableHead><TableHead>Reduction %</TableHead><TableHead>Target tCO₂e</TableHead>
                    <TableHead>Methodology</TableHead><TableHead>Status</TableHead><TableHead>Science-Based</TableHead><TableHead>SBTi</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.scope}</TableCell><TableCell>{t.baseline_year}</TableCell>
                      <TableCell>{t.baseline_co2e}</TableCell><TableCell>{t.target_year}</TableCell>
                      <TableCell>{t.target_reduction_pct}%</TableCell>
                      <TableCell>{t.baseline_co2e && t.target_reduction_pct ? (t.baseline_co2e * (1 - t.target_reduction_pct / 100)).toFixed(1) : "—"}</TableCell>
                      <TableCell>{t.methodology}</TableCell>
                      <TableCell>{trafficLight(getTargetStatus(t))}</TableCell>
                      <TableCell>{t.science_based ? <Badge className="bg-success text-success-foreground">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                      <TableCell>
                        {t.sbti_approved ? <Badge className="bg-green-500 text-white">SBTi Approved</Badge> : "—"}
                      </TableCell>
                      <TableCell className="flex gap-1">
                        {canEdit && <Button variant="ghost" size="icon" onClick={() => openEditTarget(t)}><Pencil className="h-4 w-4" /></Button>}
                        {canDelete && <Button variant="ghost" size="icon" onClick={() => setDeleteTargetId(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Asset Slide Over */}
      <SlideOverPanel open={assetSlideOpen} onClose={() => setAssetSlideOpen(false)} title={editAsset ? "Edit Asset" : "Add Asset"}>
        <div><Label>Name</Label><Input value={assetForm.name || ""} onChange={(e) => updateAssetForm("name", e.target.value)} /></div>
        <div><Label>Asset Type</Label><Input value={assetForm.asset_type || ""} onChange={(e) => updateAssetForm("asset_type", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>City</Label><Input value={assetForm.city || ""} onChange={(e) => updateAssetForm("city", e.target.value)} /></div>
          <div><Label>Country</Label><Input value={assetForm.country || ""} onChange={(e) => updateAssetForm("country", e.target.value)} /></div>
        </div>
        <div><Label>GFA (m²)</Label><Input type="number" value={assetForm.gross_floor_area_m2 || ""} onChange={(e) => updateAssetForm("gross_floor_area_m2", parseFloat(e.target.value))} /></div>
        <div><Label>Year Built</Label><Input type="number" value={assetForm.year_built || ""} onChange={(e) => updateAssetForm("year_built", parseInt(e.target.value))} /></div>
        <div><Label>Certification</Label><Input value={assetForm.certification || ""} onChange={(e) => updateAssetForm("certification", e.target.value)} /></div>
        <div><Label>Status</Label><Input value={assetForm.status || ""} onChange={(e) => updateAssetForm("status", e.target.value)} /></div>
        <Button className="w-full mt-4" onClick={saveAsset}>Save</Button>
      </SlideOverPanel>

      {/* Emission Slide Over */}
      <SlideOverPanel open={emissionSlideOpen} onClose={() => setEmissionSlideOpen(false)} title={editEmission ? "Edit Emission" : "Add Emission"}>
        <div><Label>Scope *</Label>
          <Select value={emissionForm.scope || ""} onValueChange={(v) => updateEmissionForm("scope", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{SCOPES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {emissionForm.scope === "scope_3" && (
          <div><Label>Scope 3 Category *</Label>
            <Select value={emissionForm.scope_3_category || ""} onValueChange={(v) => updateEmissionForm("scope_3_category", v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {SCOPE_3_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div><Label>Reporting Year</Label><Input type="number" value={emissionForm.reporting_year || ""} onChange={(e) => updateEmissionForm("reporting_year", parseInt(e.target.value))} /></div>
        <div><Label>tCO₂e</Label><Input type="number" value={emissionForm.co2e_tonnes || ""} onChange={(e) => updateEmissionForm("co2e_tonnes", parseFloat(e.target.value))} /></div>
        <div><Label>Emission Factor</Label><Input value={emissionForm.emission_factor || ""} onChange={(e) => updateEmissionForm("emission_factor", e.target.value)} /></div>
        <div><Label>Source</Label><Input value={emissionForm.source || ""} onChange={(e) => updateEmissionForm("source", e.target.value)} /></div>
        <div className="flex items-center gap-2">
          <Checkbox checked={emissionForm.verified || false} onCheckedChange={(v) => updateEmissionForm("verified", v)} />
          <Label>Verified</Label>
        </div>
        <Button className="w-full mt-4" onClick={saveEmission}>Save</Button>
      </SlideOverPanel>

      {/* Energy Slide Over */}
      <SlideOverPanel open={energySlideOpen} onClose={() => setEnergySlideOpen(false)} title={editEnergy ? "Edit Energy Record" : "Add Energy Record"}>
        <div><Label>Fuel Type</Label><Input value={energyForm.fuel_type || ""} onChange={(e) => updateEnergyForm("fuel_type", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Period Start</Label><Input type="date" value={energyForm.period_start || ""} onChange={(e) => updateEnergyForm("period_start", e.target.value)} /></div>
          <div><Label>Period End</Label><Input type="date" value={energyForm.period_end || ""} onChange={(e) => updateEnergyForm("period_end", e.target.value)} /></div>
        </div>
        <div><Label>Quantity</Label><Input type="number" value={energyForm.quantity || ""} onChange={(e) => updateEnergyForm("quantity", parseFloat(e.target.value))} /></div>
        <div><Label>Unit</Label><Input value={energyForm.unit || ""} onChange={(e) => updateEnergyForm("unit", e.target.value)} /></div>
        <div><Label>Cost ($)</Label><Input type="number" value={energyForm.cost || ""} onChange={(e) => updateEnergyForm("cost", parseFloat(e.target.value))} /></div>
        <Button className="w-full mt-4" onClick={saveEnergy}>Save</Button>
      </SlideOverPanel>

      {/* Target Slide Over */}
      <SlideOverPanel open={targetSlideOpen} onClose={() => setTargetSlideOpen(false)} title={editTarget ? "Edit Target" : "Add Target"}>
        <div><Label>Scope</Label>
          <Select value={targetForm.scope || ""} onValueChange={(v) => updateTargetForm("scope", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{SCOPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Baseline Year</Label><Input type="number" value={targetForm.baseline_year || ""} onChange={(e) => updateTargetForm("baseline_year", parseInt(e.target.value))} /></div>
          <div><Label>Baseline tCO₂e</Label><Input type="number" value={targetForm.baseline_co2e || ""} onChange={(e) => updateTargetForm("baseline_co2e", parseFloat(e.target.value))} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Target Year</Label><Input type="number" value={targetForm.target_year || ""} onChange={(e) => updateTargetForm("target_year", parseInt(e.target.value))} /></div>
          <div><Label>Target Reduction %</Label><Input type="number" value={targetForm.target_reduction_pct || ""} onChange={(e) => updateTargetForm("target_reduction_pct", parseFloat(e.target.value))} /></div>
        </div>
        <div><Label>Methodology</Label>
          <Select value={targetForm.methodology || ""} onValueChange={(v) => updateTargetForm("methodology", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{METHODOLOGIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox checked={targetForm.science_based || false} onCheckedChange={(v) => updateTargetForm("science_based", v)} />
          <Label>Science-Based</Label>
        </div>
        {isSBTi && (
          <>
            <div className="flex items-center gap-2">
              <Checkbox checked={targetForm.sbti_approved || false} onCheckedChange={(v) => updateTargetForm("sbti_approved", v)} />
              <Label>SBTi Approved</Label>
            </div>
            {targetForm.sbti_approved && (
              <div><Label>SBTi Approval Date</Label><Input type="date" value={targetForm.sbti_approval_date || ""} onChange={(e) => updateTargetForm("sbti_approval_date", e.target.value)} /></div>
            )}
          </>
        )}
        <Button className="w-full mt-4" onClick={saveTarget}>Save</Button>
      </SlideOverPanel>

      <ConfirmDialog open={!!deleteAssetId} onConfirm={deleteAsset} onCancel={() => setDeleteAssetId(null)} />
      <ConfirmDialog open={!!deleteEmissionId} onConfirm={deleteEmission} onCancel={() => setDeleteEmissionId(null)} />
      <ConfirmDialog open={!!deleteEnergyId} onConfirm={deleteEnergy} onCancel={() => setDeleteEnergyId(null)} />
      <ConfirmDialog open={!!deleteTargetId} onConfirm={deleteTarget} onCancel={() => setDeleteTargetId(null)} />
    </div>
  );
};

export default Portfolio;
