import { BarChart3, Users, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Total Users", value: "2,847", icon: Users, change: "+12%" },
  { label: "Revenue", value: "$48.2K", icon: TrendingUp, change: "+8.1%" },
  { label: "Reports", value: "142", icon: FileText, change: "+24%" },
  { label: "Analytics", value: "98.2%", icon: BarChart3, change: "+2.4%" },
];

const Dashboard = () => {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
      <p className="text-muted-foreground text-sm mb-6">Welcome back to Phoenix</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-primary mt-1">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
