import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersTab from "@/components/settings/UsersTab";
import SprintsTab from "@/components/settings/SprintsTab";
import ClientProfileTab from "@/components/settings/ClientProfileTab";
import DataExportTab from "@/components/settings/DataExportTab";

const Settings = () => {
  const { role, clientId, user, client } = useAuth();

  if (role !== "admin") return <Navigate to="/xmatrix" replace />;
  if (!clientId || !user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Settings</h1>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="sprints">Sprints</TabsTrigger>
          <TabsTrigger value="client">Client Profile</TabsTrigger>
          <TabsTrigger value="export">Data Export</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UsersTab clientId={clientId} currentUserId={user.id} /></TabsContent>
        <TabsContent value="sprints"><SprintsTab clientId={clientId} /></TabsContent>
        <TabsContent value="client"><ClientProfileTab clientId={clientId} /></TabsContent>
        <TabsContent value="export"><DataExportTab clientId={clientId} clientSlug={client?.name?.replace(/\s+/g, "_") || "export"} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
