"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, KeyRound, UserX, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogoutButton } from "@/components/logout-button";
import {
  useAddUser,
  useAuditLogs,
  useSettings,
  useSummaries,
  useUpdateSettings,
  useUpdateUser,
} from "@/lib/queries";
import { useIsAdmin } from "@/store/auth";

export default function SettingsPage() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return <p className="py-12 text-center text-muted-foreground">Admins only.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">සැකසුම් · Settings</h1>
        <LogoutButton />
      </div>

      <Tabs defaultValue="prices">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prices">Prices</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        <TabsContent value="prices">
          <PricesTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PricesTab() {
  const { data: settings } = useSettings();
  const update = useUpdateSettings();
  const [breakfast, setBreakfast] = useState("");
  const [dinner, setDinner] = useState("");
  const [egg, setEgg] = useState("");

  useEffect(() => {
    if (settings) {
      setBreakfast(String(settings.breakfast_price));
      setDinner(String(settings.dinner_price));
      setEgg(String(settings.egg_price));
    }
  }, [settings]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <p className="text-sm text-muted-foreground">
          Price changes apply only to new entries. Historical records keep their original prices.
        </p>
        <PriceField label="උදේ කෑම · Breakfast" value={breakfast} onChange={setBreakfast} />
        <PriceField label="රෑ කෑම · Dinner" value={dinner} onChange={setDinner} />
        <PriceField label="බිත්තරය · Egg" value={egg} onChange={setEgg} />
        <Button
          className="w-full"
          disabled={update.isPending}
          onClick={() =>
            update.mutate(
              {
                breakfast_price: Number(breakfast),
                dinner_price: Number(dinner),
                egg_price: Number(egg),
              },
              {
                onSuccess: () => toast.success("Prices updated."),
                onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
              },
            )
          }
        >
          Save prices
        </Button>
      </CardContent>
    </Card>
  );
}

function PriceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="flex-1">{label}</Label>
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">Rs.</span>
        <Input
          type="number"
          inputMode="numeric"
          className="w-28"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function UsersTab() {
  const { data: summaries } = useSummaries();
  const addUser = useAddUser();
  const updateUser = useUpdateUser();
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");

  return (
    <div className="space-y-3">
      <Button className="w-full" onClick={() => setAddOpen(true)}>
        <Plus className="h-4 w-4" /> Add user
      </Button>

      {summaries?.map((s) => (
        <Card key={s.user.id}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="font-semibold">
                {s.user.name}
                {s.user.role === "admin" && (
                  <span className="ml-2 text-xs text-accent">admin</span>
                )}
                {!s.user.active && (
                  <span className="ml-2 text-xs text-muted-foreground">disabled</span>
                )}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Reset PIN"
              onClick={() =>
                updateUser.mutate(
                  { id: s.user.id, reset_pin: true },
                  {
                    onSuccess: () => toast.success(`${s.user.name}'s PIN reset.`),
                    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
                  },
                )
              }
            >
              <KeyRound className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={s.user.active ? "Disable" : "Enable"}
              className={s.user.active ? "text-destructive" : "text-accent"}
              onClick={() =>
                updateUser.mutate(
                  { id: s.user.id, active: !s.user.active },
                  {
                    onSuccess: () =>
                      toast.success(`${s.user.name} ${s.user.active ? "disabled" : "enabled"}.`),
                    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
                  },
                )
              }
            >
              {s.user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            </Button>
          </CardContent>
        </Card>
      ))}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="newname">Name</Label>
            <Input id="newname" value={name} onChange={(e) => setName(e.target.value)} />
            <Label>Role</Label>
            <div className="flex gap-2">
              <Button
                variant={role === "user" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setRole("user")}
              >
                User
              </Button>
              <Button
                variant={role === "admin" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setRole("admin")}
              >
                Admin
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The user sets their own 4-digit PIN the first time they log in.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={addUser.isPending || !name.trim()}
              onClick={() =>
                addUser.mutate(
                  { name: name.trim(), role },
                  {
                    onSuccess: () => {
                      toast.success("User added.");
                      setName("");
                      setRole("user");
                      setAddOpen(false);
                    },
                    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
                  },
                )
              }
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuditTab() {
  const { data: logs, isLoading } = useAuditLogs();

  return (
    <div className="space-y-2">
      {isLoading && <p className="py-8 text-center text-muted-foreground">Loading…</p>}
      {logs?.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">No activity yet.</p>
      )}
      {logs?.map((log) => (
        <Card key={log.id}>
          <CardContent className="p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{log.action.replace(/_/g, " ")}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(log.created_at), "dd MMM HH:mm")}
              </span>
            </div>
            {log.details && (
              <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-[11px] text-muted-foreground">
                {JSON.stringify(log.details)}
              </pre>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
