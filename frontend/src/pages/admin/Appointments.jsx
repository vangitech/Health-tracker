import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAxios as axios } from '@/contexts/AdminAuthContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar } from 'lucide-react'

const statuses = ['all', 'scheduled', 'completed', 'cancelled']

const statusBadgeVariant = {
  scheduled: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Appointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    let cancelled = false
    async function fetchAppointments() {
      try {
        setLoading(true)
        const params = {}
        if (statusFilter !== 'all') params.status = statusFilter
        const { data } = await axios.get('/appointments', { params })
        if (!cancelled) setAppointments(data.appointments || data.data || [])
      } catch {
        if (!cancelled) setAppointments([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAppointments()
    return () => { cancelled = true }
  }, [statusFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 text-zinc-400 animate-spin" />
          <p className="text-sm text-zinc-500">Loading appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Appointments</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage patient appointments</p>
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
                      onClick={() =>
                        navigate(`/iaccess/patients/${apt.userId || apt.patientId}`)
                      }
                    >
                      {apt.patientName || apt.firstName + ' ' + apt.lastName || '—'}
                    </button>
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {apt.patientEmail || apt.email || '—'}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {formatDate(apt.date || apt.appointmentDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[apt.status] || 'secondary'}>
                      {apt.status || 'scheduled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 max-w-xs truncate">
                    {apt.notes || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
