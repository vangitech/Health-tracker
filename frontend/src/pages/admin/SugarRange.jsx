import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAxios as axios } from '@/contexts/AdminAuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Loader2, Users } from 'lucide-react'

function getInitials(firstName, lastName) {
  if (!firstName && !lastName) return '?'
  return ((firstName || '')[0] || '') + ((lastName || '')[0] || '')
}

function formatTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getReadingData(value) {
  const num = Number(value)
  if (isNaN(num)) return { color: 'border-zinc-700', badge: 'secondary', label: String(value) }
  if (num > 10.0 || num < 4.0) return { color: 'border-red-500', badge: 'destructive', label: `${num.toFixed(1)} mmol/L` }
  if (num >= 7.1) return { color: 'border-yellow-500', badge: 'secondary', label: `${num.toFixed(1)} mmol/L` }
  return { color: 'border-emerald-500', badge: 'default', label: `${num.toFixed(1)} mmol/L` }
}

function PatientCard({ patient, onClick }) {
  const reading = getReadingData(patient.latestReading)

  return (
    <Card
      className={`cursor-pointer border-l-4 ${reading.color} transition-colors hover:bg-zinc-800/50`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-10 shrink-0">
              <AvatarFallback className="text-xs">
                {getInitials(patient.firstName, patient.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium text-zinc-100 truncate">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-sm text-zinc-500 truncate">{patient.email}</p>
              <p className="text-sm text-zinc-500">{patient.phone || '—'}</p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-4">
            <Badge variant={reading.badge} className="text-sm px-3 py-1">
              {reading.label}
            </Badge>
            <div className="mt-1 text-xs text-zinc-500">
              <p>{formatDate(patient.readingDate || patient.latestReadingDate)}</p>
              <p>{formatTime(patient.readingDate || patient.latestReadingDate)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PatientList({ endpoint, title, emptyIcon: EmptyIcon, emptyText }) {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const { data: res } = await axios.get(endpoint)
        if (!cancelled) setData(Array.isArray(res) ? res : res.patients || res.data || [])
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [endpoint])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 text-zinc-400 animate-spin" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-red-400">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Users className="size-4" />
        <span>{data.length} patient{data.length !== 1 ? 's' : ''} {title}</span>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
          <EmptyIcon className="size-8 text-zinc-600" />
          <p className="text-sm text-zinc-500">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((patient) => (
            <PatientCard
              key={patient._id || patient.id}
              patient={patient}
              onClick={() => navigate(`/iaccess/patients/${patient._id || patient.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SugarRange() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Sugar Range</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Monitor patients whose blood sugar readings are outside or within the healthy range
        </p>
      </div>

      <Tabs defaultValue="out-of-range">
        <TabsList>
          <TabsTrigger value="out-of-range" className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Out of Range
          </TabsTrigger>
          <TabsTrigger value="in-range" className="flex items-center gap-2">
            <CheckCircle className="size-4" />
            In Range
          </TabsTrigger>
        </TabsList>
        <TabsContent value="out-of-range">
          <PatientList
            endpoint="/patients/range/out-of-range"
            title="out of range"
            emptyIcon={AlertTriangle}
            emptyText="All patients are within healthy range"
          />
        </TabsContent>
        <TabsContent value="in-range">
          <PatientList
            endpoint="/patients/range/in-range"
            title="in range"
            emptyIcon={CheckCircle}
            emptyText="No patients are currently in range"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
