import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame } from "lucide-react";

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-xl gradient-phoenix flex items-center justify-center shadow-glow mb-4">
            <Flame className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">PHOENIX</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-secondary border-border focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-secondary border-border focus:ring-primary"
            />
          </div>

          <Button type="submit" className="w-full gradient-phoenix text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-opacity">
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Don't have an account?{" "}
          <span className="text-primary cursor-pointer hover:underline">Sign up</span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
