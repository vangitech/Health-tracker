import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminAxios as axios } from '@/contexts/AdminAuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Loader2,
  Activity,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [patient, setPatient] = useState(null)
  const [stats, setStats] = useState(null)
  const [entries, setEntries] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentNotes, setAppointmentNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchPatient() {
      try {
        setLoading(true)
        setError(null)
        const { data } = await axios.get(`/api/admin/patients/${id}`)
        setPatient(data.patient || data)
        setStats(data.stats || null)
        setEntries(data.entries || [])
        setAppointments(data.appointments || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patient')
        setPatient(null)
      } finally {
        setLoading(false)
      }
    }
    fetchPatient()
  }, [id])

  async function handleAddAppointment() {
    if (!appointmentDate) return
    try {
      setSubmitting(true)
      const { data } = await axios.post(`/api/admin/patients/${id}/appointments`, {
        date: appointmentDate,
        notes: appointmentNotes,
      })
      setAppointments((prev) => [...prev, data.appointment || data])
      setDialogOpen(false)
      setAppointmentDate('')
      setAppointmentNotes('')
    } catch (err) {
      console.error('Failed to add appointment', err)
    } finally {
      setSubmitting(false)
    }
  }

  function getInitials(firstName, lastName) {
    if (!firstName && !lastName) return '?'
    return ((firstName || '')[0] || '') + ((lastName || '')[0] || '')
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatTime(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getGlucoseColor(value) {
    if (value == null) return ''
    if (value >= 4.0 && value <= 7.0) return 'text-green-400'
    if (value >= 7.1 && value <= 10.0) return 'text-yellow-400'
    return 'text-red-400'
  }

  function getGlucoseBadge(value) {
    if (value == null) return null
    if (value >= 4.0 && value <= 7.0)
      return (
        <Badge variant="secondary" className="bg-green-900/50 text-green-400 border-green-700">
          <CheckCircle className="size-3 mr-1" />
          In Range
        </Badge>
      )
    if (value >= 7.1 && value <= 10.0)
      return (
        <Badge variant="secondary" className="bg-yellow-900/50 text-yellow-400 border-yellow-700">
          <AlertTriangle className="size-3 mr-1" />
          Borderline
        </Badge>
      )
    return (
      <Badge variant="secondary" className="bg-red-900/50 text-red-400 border-red-700">
        <AlertTriangle className="size-3 mr-1" />
        High
      </Badge>
    )
  }

  function getMealLabel(mealType) {
    if (!mealType) return '—'
    const labels = { before_breakfast: 'Before Breakfast', after_breakfast: 'After Breakfast', before_lunch: 'Before Lunch', after_lunch: 'After Lunch', before_dinner: 'Before Dinner', after_dinner: 'After Dinner', fasting: 'Fasting', random: 'Random' }
    return labels[mealType] || mealType
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 text-zinc-400 animate-spin" />
          <p className="text-sm text-zinc-500">Loading patient details...</p>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-red-400">{error || 'Patient not found'}</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/iaccess/patients')}>
            <ArrowLeft className="size-4 mr-1" />
            Back to Patients
          </Button>
        </div>
      </div>
    )
  }

  const statCards = stats
    ? [
        { label: 'Total Entries', value: stats.totalEntries ?? 0, icon: Activity, color: 'text-blue-400' },
        { label: 'Avg Glucose', value: stats.averageGlucose != null ? stats.averageGlucose.toFixed(1) : '—', icon: Activity, color: 'text-purple-400' },
        { label: 'In Range', value: stats.inRange ?? 0, icon: CheckCircle, color: 'text-green-400' },
        { label: 'Borderline', value: stats.borderline ?? 0, icon: AlertTriangle, color: 'text-yellow-400' },
        { label: 'High', value: stats.highCount ?? 0, icon: AlertTriangle, color: 'text-orange-400' },
        { label: 'Low', value: stats.lowCount ?? 0, icon: AlertTriangle, color: 'text-red-400' },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/iaccess/patients')}
          className="shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Patient Details</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Viewing patient information and history</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          <Avatar className="size-14">
            <AvatarFallback className="text-lg">
              {getInitials(patient.firstName, patient.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-zinc-100 truncate">
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="text-sm text-zinc-400 truncate">{patient.email}</p>
            <p className="text-sm text-zinc-400">{patient.phone || 'No phone'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${patient.phone}`}>
                <Phone className="size-4 mr-1" />
                Call
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${patient.email}`}>
                <Mail className="size-4 mr-1" />
                Email
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`size-4 ${stat.color}`} />
                    <span className="text-xs text-zinc-500">{stat.label}</span>
                  </div>
                  <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-zinc-100">Recent Blood Sugar Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No entries recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 px-3 text-zinc-500 font-medium">Date</th>
                    <th className="text-left py-2 px-3 text-zinc-500 font-medium">Time</th>
                    <th className="text-left py-2 px-3 text-zinc-500 font-medium">Glucose</th>
                    <th className="text-left py-2 px-3 text-zinc-500 font-medium">Meal Type</th>
                    <th className="text-left py-2 px-3 text-zinc-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry._id || entry.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3 text-zinc-300">{formatDate(entry.date || entry.timestamp)}</td>
                      <td className="py-2.5 px-3 text-zinc-400">{formatTime(entry.date || entry.timestamp)}</td>
                      <td className={`py-2.5 px-3 font-medium ${getGlucoseColor(entry.glucose || entry.value)}`}>
                        {entry.glucose ?? entry.value ?? '—'}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">{getMealLabel(entry.mealType)}</td>
                      <td className="py-2.5 px-3">{getGlucoseBadge(entry.glucose || entry.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-zinc-100">Appointments</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Calendar className="size-4 mr-1" />
                Add Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="appointment-date">Date & Time</Label>
                  <Input
                    id="appointment-date"
                    type="datetime-local"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-notes">Notes</Label>
                  <textarea
                    id="appointment-notes"
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
                  disabled={!appointmentDate || submitting}
                  onClick={handleAddAppointment}
                >
                  {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Create Appointment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4 text-center">No appointments scheduled</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt._id || apt.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-zinc-800"
                >
                  <Calendar className="size-4 text-zinc-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">
                      {formatDate(apt.date)}
                      {apt.date && <span className="text-zinc-500 ml-1">{formatTime(apt.date)}</span>}
                    </p>
                    {apt.status && (
                      <Badge
                        variant="secondary"
                        className={
                          apt.status === 'completed'
                            ? 'bg-green-900/50 text-green-400 border-green-700 mt-1'
                            : apt.status === 'cancelled'
                              ? 'bg-red-900/50 text-red-400 border-red-700 mt-1'
                              : 'bg-blue-900/50 text-blue-400 border-blue-700 mt-1'
                        }
                      >
                        {apt.status}
                      </Badge>
                    )}
                    {apt.notes && (
                      <p className="text-sm text-zinc-400 mt-1">{apt.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
