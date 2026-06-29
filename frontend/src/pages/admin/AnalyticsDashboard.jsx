import { useState, useEffect } from 'react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { adminAxios as axios } from '@/contexts/AdminAuthContext'
import {
  Users,
  Activity,
  FileText,
  UserPlus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Shield,
  Loader2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'

const statCards = [
  { key: 'totalPatients', label: 'Total Patients', icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { key: 'activeToday', label: 'Active Today', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { key: 'totalEntries30d', label: 'Total Entries (30d)', icon: FileText, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { key: 'newPatients30d', label: 'New Patients (30d)', icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: 'upcomingAppointments', label: 'Upcoming Appointments', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { key: 'outOfRangePatients', label: 'Out of Range', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  { key: 'inRangePatients', label: 'In Range', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  { key: 'totalAdmins', label: 'Total Staff', icon: Shield, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
]

export default function AnalyticsDashboard() {
  const { admin } = useAdminAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAnalytics = async () => {
    try {
      setError('')
      const { data: res } = await axios.get('/analytics')
      setData(res)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 text-zinc-400 animate-spin" />
          <p className="text-sm text-zinc-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="size-8 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Analytics Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Welcome back, {admin?.firstName || admin?.email || 'Admin'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, color, bg }) => (
          <Card key={key} className="transition-all duration-200 hover:scale-[1.02] hover:bg-zinc-800/80 cursor-default">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">{label}</CardTitle>
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`size-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-zinc-100">
                {data?.[key] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Weekly Registrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.weeklyRegistrations?.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyRegistrations} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.269 0 0)" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: 'oklch(0.708 0 0)', fontSize: 12 }}
                    axisLine={{ stroke: 'oklch(0.269 0 0)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'oklch(0.708 0 0)', fontSize: 12 }}
                    axisLine={{ stroke: 'oklch(0.269 0 0)' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(0.205 0 0)',
                      border: '1px solid oklch(0.269 0 0)',
                      borderRadius: '8px',
                      color: 'oklch(0.985 0 0)',
                      fontSize: '13px',
                    }}
                    cursor={{ fill: 'oklch(0.269 0 0)' }}
                  />
                  <Bar dataKey="count" fill="oklch(0.577 0.245 27.33)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 py-8 text-center">No registration data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
