import { useState, useEffect } from 'react';
import { adminAxios as axios } from '@/contexts/AdminAuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2,
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
  Heart,
  UserCog,
  Power,
  PowerOff,
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getInitials(firstName, lastName) {
  if (!firstName && !lastName) return '?';
  return ((firstName || '')[0] || '') + ((lastName || '')[0] || '');
}

function getRoleIcon(role) {
  switch (role) {
    case 'doctor':
      return Stethoscope;
    case 'recordofficer':
      return ClipboardList;
    case 'nurse':
      return Heart;
    default:
      return ShieldCheck;
  }
}

function getRoleLabel(role) {
  switch (role) {
    case 'doctor':
      return 'Doctor';
    case 'recordofficer':
      return 'Record Officer';
    case 'nurse':
      return 'Nurse';
    case 'superadmin':
      return 'Super Admin';
    default:
      return 'Admin';
  }
}

export default function AdminManagement() {
  const { admin } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    role: 'admin',
  });

  const roleOptions = [
    { value: 'admin', label: 'Admin', icon: UserCog },
    { value: 'doctor', label: 'Doctor', icon: Stethoscope },
    { value: 'recordofficer', label: 'Record Officer', icon: ClipboardList },
    { value: 'nurse', label: 'Nurse', icon: Heart },
  ];

  useEffect(() => {
    let cancelled = false;
    async function fetchAdmins() {
      try {
        setLoading(true);
        const { data } = await axios.get('/admins');
        if (!cancelled) setAdmins(Array.isArray(data) ? data : data.admins || data.data || []);
      } catch {
        if (!cancelled) setAdmins([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAdmins();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleFormChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateMessage(null);
      const { data } = await axios.post('/register', form);
      setAdmins((prev) => [...prev, data.user || data.admin || data]);
      setDialogOpen(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', phone: '', role: 'admin' });
    } catch (err) {
      setCreateMessage(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(adminId, currentlyActive) {
    try {
      setToggling(adminId);
      const { data } = await axios.put(`/users/${adminId}/toggle-active`);
      setAdmins((prev) => prev.map((a) => ((a._id || a.id) === adminId ? { ...a, isActive: data.isActive } : a)));
    } catch {
      // silently fail
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(adminId) {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      setDeleting(adminId);
      await axios.delete(`/users/${adminId}`);
      setAdmins((prev) => prev.filter((a) => (a._id || a.id) !== adminId));
    } catch {
      // silently fail
    } finally {
      setDeleting(null);
    }
  }

  const isSuperAdmin = admin?.role === 'superadmin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 text-zinc-400 animate-spin" />
          <p className="text-sm text-zinc-500">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Staff Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage staff accounts and roles</p>
        </div>
        {isSuperAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Create Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Staff Account</DialogTitle>
                <DialogDescription>Add a new staff member with a specific role</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="afn">First Name</Label>
                    <Input id="afn" value={form.firstName} onChange={handleFormChange('firstName')} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aln">Last Name</Label>
                    <Input id="aln" value={form.lastName} onChange={handleFormChange('lastName')} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aemail">Email</Label>
                  <Input id="aemail" type="email" value={form.email} onChange={handleFormChange('email')} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apass">Password</Label>
                  <Input
                    id="apass"
                    type="password"
                    value={form.password}
                    onChange={handleFormChange('password')}
                    required
                  />
                  <div className="space-y-1 pt-1">
                    <p className={`text-[11px] ${form.password.length >= 8 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {form.password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </p>
                    <p className={`text-[11px] ${/\d/.test(form.password) ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      {/\d/.test(form.password) ? '✓' : '○'} At least one number
                    </p>
                    <p
                      className={`text-[11px] ${/[^a-zA-Z0-9]/.test(form.password) ? 'text-emerald-400' : 'text-zinc-500'}`}
                    >
                      {/[^a-zA-Z0-9]/.test(form.password) ? '✓' : '○'} At least one special character
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aphone">Phone</Label>
                  <Input id="aphone" value={form.phone} onChange={handleFormChange('phone')} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm((prev) => ({ ...prev, role: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="size-4" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {createMessage && <p className="text-xs text-red-400">{createMessage}</p>}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating && <Loader2 className="size-4 animate-spin" />}
                    Create
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {admins.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
          <Shield className="size-8 text-zinc-600" />
          <p className="text-sm text-zinc-500">No admin users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                {isSuperAdmin && <TableHead className="w-20">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((u) => {
                const uid = u._id || u.id;
                const isSelf = uid === (admin?._id || admin?.id);
                const isSuper = u.role === 'superadmin';
                return (
                  <TableRow key={uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const RoleIcon = getRoleIcon(u.role);
                          return <RoleIcon className="size-4 text-zinc-500" />;
                        })()}
                        <span className="font-medium text-zinc-100">
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={isSuper ? 'default' : 'secondary'}>{getRoleLabel(u.role)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.isActive !== false
                            ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700'
                            : 'bg-red-900/50 text-red-400 border border-red-700'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-400' : 'bg-red-400'}`}
                        />
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-400">{formatDate(u.createdAt)}</TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!isSuper && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={toggling === uid}
                                onClick={() => handleToggleActive(uid, u.isActive)}
                                title={u.isActive !== false ? 'Disable' : 'Enable'}
                              >
                                {toggling === uid ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : u.isActive !== false ? (
                                  <PowerOff className="size-4 text-zinc-400 hover:text-yellow-400" />
                                ) : (
                                  <Power className="size-4 text-zinc-400 hover:text-emerald-400" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={deleting === uid}
                                onClick={() => handleDelete(uid)}
                                title="Delete"
                              >
                                {deleting === uid ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4 text-red-400" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
