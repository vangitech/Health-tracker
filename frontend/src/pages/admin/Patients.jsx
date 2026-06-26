import { useState, useEffect, useCallback } from 'react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export default function Patients() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit }
      if (debouncedSearch) params.search = debouncedSearch
      const { data } = await axios.get('/api/admin/patients', { params })
      setPatients(data.patients || data.data || [])
      setTotalPages(data.totalPages || data.pagination?.totalPages || 1)
      setTotal(data.total || data.pagination?.total || 0)
    } catch (err) {
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, limit])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 text-zinc-400 animate-spin" />
          <p className="text-sm text-zinc-500">Loading patients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Patients</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage all registered patients</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {patients.length === 0 ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <p className="text-sm text-zinc-500">No patients found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Latest Reading</TableHead>
                  <TableHead>Last Appointment</TableHead>
                  <TableHead>Next Appointment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow
                    key={patient._id || patient.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/iaccess/patients/${patient._id || patient.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(patient.firstName, patient.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-zinc-100">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400">{patient.email}</TableCell>
                    <TableCell className="text-zinc-400">{patient.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {patient.latestReading ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {formatDate(patient.lastAppointment)}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {formatDate(patient.nextAppointment)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/iaccess/patients/${patient._id || patient.id}`)
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
