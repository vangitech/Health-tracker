import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAxios as axios } from '@/contexts/AdminAuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statuses = ['all', 'scheduled', 'completed', 'cancelled'];

const statusBadgeStyle = {
  scheduled: 'bg-blue-900/50 text-blue-400 border-blue-700',
  completed: 'bg-emerald-900/50 text-emerald-400 border-emerald-700',
  cancelled: 'bg-red-900/50 text-red-400 border-red-700',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchAppointments() {
      try {
        setLoading(true);
        const params = {};
        if (statusFilter !== 'all') params.status = statusFilter;
        const { data } = await axios.get('/appointments', { params });
        if (!cancelled) setAppointments(Array.isArray(data) ? data : data.appointments || data.data || []);
      } catch {
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAppointments();
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  function openNewDialog() {
    setDialogOpen(true);
    setSelectedPatient('');
    setAppointmentDate('');
    setAppointmentNotes('');
    fetchPatients();
  }

  async function fetchPatients() {
    try {
      setPatientsLoading(true);
      const { data } = await axios.get('/patients', { params: { limit: 200 } });
      const list = Array.isArray(data) ? data : data.patients || data.data || [];
      setPatients(list);
    } catch {
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }

  async function handleCreate() {
    if (!selectedPatient || !appointmentDate) return;
    try {
      setSubmitting(true);
      await axios.post(`/patients/${selectedPatient}/appointments`, {
        appointmentDate,
        notes: appointmentNotes,
      });
      setDialogOpen(false);
      setAppointmentDate('');
      setAppointmentNotes('');
      setSelectedPatient('');
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await axios.get('/appointments', { params });
      setAppointments(Array.isArray(data) ? data : data.appointments || data.data || []);
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  function getPatientName(apt) {
    if (apt.userId && typeof apt.userId === 'object') {
      return `${apt.userId.firstName || ''} ${apt.userId.lastName || ''}`.trim();
    }
    return apt.patientName || apt.name || '—';
  }

  function getPatientEmail(apt) {
    if (apt.userId && typeof apt.userId === 'object') {
      return apt.userId.email || '—';
    }
    return apt.patientEmail || apt.email || '—';
  }

  function getPatientId(apt) {
    if (apt.userId && typeof apt.userId === 'object') {
      return apt.userId._id || apt.userId.id;
    }
    return apt.userId || apt.patientId;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 text-zinc-400 animate-spin" />
          <p className="text-sm text-zinc-500">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Appointments</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage patient appointments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="size-4 mr-1" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Appointment</DialogTitle>
              <DialogDescription>Book an appointment for a registered patient</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Patient</Label>
                {patientsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-500 py-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading patients...
                  </div>
                ) : (
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p._id || p.id} value={p._id || p.id}>
                          {p.firstName} {p.lastName} — {p.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-date">Date & Time</Label>
                <Input
                  id="apt-date"
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-notes">Notes</Label>
                <textarea
                  id="apt-notes"
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="Add notes about the appointment..."
                />
              </div>
              <Button
                variant="default"
                className="w-full"
                disabled={!selectedPatient || !appointmentDate || submitting}
                onClick={handleCreate}
              >
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Create Appointment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {statuses.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
          <Calendar className="size-8 text-zinc-600" />
          <p className="text-sm text-zinc-500">No appointments found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Name</TableHead>
                <TableHead>Patient Email</TableHead>
                <TableHead>Appointment Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt._id || apt.id}>
                  <TableCell>
                    <button
                      className="font-medium text-zinc-100 hover:text-emerald-400 transition-colors text-left"
                      onClick={() => navigate(`/iaccess/patients/${getPatientId(apt)}`)}
                    >
                      {getPatientName(apt)}
                    </button>
                  </TableCell>
                  <TableCell className="text-zinc-400">{getPatientEmail(apt)}</TableCell>
                  <TableCell className="text-zinc-400">{formatDate(apt.date || apt.appointmentDate)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusBadgeStyle[apt.status] || 'bg-zinc-800 text-zinc-400'}>
                      {apt.status || 'scheduled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 max-w-xs truncate">{apt.notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
