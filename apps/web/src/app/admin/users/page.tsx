'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Role } from '@buymedicines/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { useBranches } from '@/hooks/admin/use-catalog';
import { useCreateStaff, useCustomerList, useStaffList, useToggleUserActive } from '@/hooks/admin/use-users';
import { useAuthStore } from '@/store/admin-auth-store';

export default function UsersPage() {
  const { data: staff, isLoading: loadingStaff } = useStaffList(1);
  const { data: customers, isLoading: loadingCustomers } = useCustomerList(1);
  const { data: branches } = useBranches();
  const toggleActive = useToggleUserActive();
  const createStaff = useCreateStaff();
  const currentRole = useAuthStore((s) => s.user?.role);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'pharmacist' as const,
    branchId: '',
  });

  function handleSubmit() {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password.trim(),
      role: form.role,
      ...(form.branchId ? { branchId: form.branchId } : {}),
    };

    createStaff.mutate(payload as never, {
      onSuccess: () => {
        setOpen(false);
        setForm({
          name: '',
          email: '',
          phone: '',
          password: '',
          role: 'pharmacist',
          branchId: '',
        });
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        {currentRole === Role.ADMIN ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStaff ? (
                    <tr><td className="p-4 text-muted-foreground" colSpan={5}>Loading...</td></tr>
                  ) : (
                    staff?.items.map((member) => (
                      <tr key={member.id} className="border-b border-border/40">
                        <td className="p-3 font-medium">{member.name}</td>
                        <td className="p-3">{member.email}</td>
                        <td className="p-3 capitalize">{member.role.replace(/_/g, ' ')}</td>
                        <td className="p-3"><Badge variant={member.isActive ? 'success' : 'destructive'}>{member.isActive ? 'Active' : 'Inactive'}</Badge></td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => toggleActive.mutate({ id: member.id, activate: !member.isActive })}>
                            {member.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Joined</th><th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCustomers ? (
                    <tr><td className="p-4 text-muted-foreground" colSpan={4}>Loading...</td></tr>
                  ) : (
                    customers?.items.map((customer) => (
                      <tr key={customer.id} className="border-b border-border/40">
                        <td className="p-3 font-medium">{customer.name}</td>
                        <td className="p-3">{customer.phone}</td>
                        <td className="p-3 text-xs text-muted-foreground">{formatDate(customer.createdAt)}</td>
                        <td className="p-3"><Badge variant={customer.isActive ? 'success' : 'destructive'}>{customer.isActive ? 'Active' : 'Inactive'}</Badge></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open && currentRole === Role.ADMIN} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={10} />
            </div>
            <div>
              <Label>Temporary Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as typeof form.role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="pharmacist">Pharmacist</SelectItem>
                  <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
                  <SelectItem value="delivery_boy">Delivery Boy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Branch</Label>
              <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={
                createStaff.isPending ||
                !form.name.trim() ||
                !form.email.trim() ||
                !form.phone.trim() ||
                !form.password.trim()
              }
            >
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
