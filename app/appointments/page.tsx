"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppointmentCard from "@/components/appointments/AppointmentCard"
import BookAppointmentDialog from "@/components/appointments/BookAppointmentDialog"
import AppointmentCalendar from "@/components/appointments/AppointmentCalendar"
import MainLayout from "@/components/layout/MainLayout"
import PrintAppointmentList from "@/components/appointments/PrintAppointmentList"
import AppointmentStatsComponent from "@/components/appointments/AppointmentStats"
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Filter,
} from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Appointment {
  id: string
  appointmentDate: string
  appointmentTime: string
  duration: number
  status: string
  type: string
  priority: string
  reason?: string | null
  patient: {
    id: string
    firstName: string
    lastName: string
    email?: string | null
    phone: string
  }
  doctor: {
    id: string
    name: string
    specialization: string
  }
  checkedInAt?: string | null
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null)
  const [cancellationReason, setCancellationReason] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")

  const fetchAppointments = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (typeFilter !== "all") params.append("type", typeFilter)
      if (dateFilter) params.append("date", dateFilter)

      const response = await fetch(`/api/appointments?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setAppointments(data)
      } else {
        toast.error(data.error || "Failed to fetch appointments")
      }
    } catch (error) {
      toast.error("Failed to fetch appointments")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter, typeFilter, dateFilter])

  const handleCancel = async () => {
    if (!appointmentToCancel) return

    try {
      const response = await fetch(
        `/api/appointments/${appointmentToCancel}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancelledBy: "user", // You can get this from session
            cancellationReason,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel appointment")
      }

      toast.success("Appointment cancelled successfully")
      fetchAppointments()
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel appointment")
    } finally {
      setCancelDialogOpen(false)
      setAppointmentToCancel(null)
      setCancellationReason("")
    }
  }

  const handleCheckIn = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}/checkin`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check in")
      }

      toast.success("Checked in successfully")
      fetchAppointments()
    } catch (error: any) {
      toast.error(error.message || "Failed to check in")
    }
  }

  const openCancelDialog = (id: string) => {
    setAppointmentToCancel(id)
    setCancelDialogOpen(true)
  }

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Time",
      "Patient",
      "Doctor",
      "Type",
      "Status",
      "Reason",
    ]

    const rows = appointments.map((a) => [
      new Date(a.appointmentDate).toLocaleDateString(),
      a.appointmentTime,
      `${a.patient.firstName} ${a.patient.lastName}`,
      a.doctor.name,
      a.type,
      a.status,
      a.reason || "",
    ])

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `appointments_${new Date().toISOString().split("T")[0]}.csv`
    )
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Appointments exported successfully")
  }

  // Filter appointments by search query
  const filteredAppointments = appointments.filter((appointment) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      appointment.patient.firstName.toLowerCase().includes(searchLower) ||
      appointment.patient.lastName.toLowerCase().includes(searchLower) ||
      appointment.doctor.name.toLowerCase().includes(searchLower) ||
      appointment.reason?.toLowerCase().includes(searchLower)
    )
  })

  const stats = {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === "SCHEDULED").length,
    completed: appointments.filter((a) => a.status === "COMPLETED").length,
    cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
  }

  const todayAppointments = appointments.filter((a) => {
    const today = new Date().toDateString()
    const appointmentDate = new Date(a.appointmentDate).toDateString()
    return today === appointmentDate
  })

  const upcomingAppointments = appointments.filter((a) => {
    const appointmentDateTime = new Date(
      `${a.appointmentDate.split("T")[0]}T${a.appointmentTime}`
    )
    return appointmentDateTime > new Date() && a.status === "SCHEDULED"
  })

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-500 mt-1">
              Manage and schedule patient appointments
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Export
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={exportToCSV}>
      Export to CSV
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <div>
        <PrintAppointmentList 
          appointments={filteredAppointments}
          title="Appointments Report"
        />
      </div>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
            <BookAppointmentDialog onSuccess={fetchAppointments} />
          </div>
        </div>

        {/* Statistics Cards */}
       <AppointmentStatsComponent />

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CONSULTATION">Consultation</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  <SelectItem value="ROUTINE_CHECKUP">Routine Checkup</SelectItem>
                  <SelectItem value="IN_PERSON">In Person</SelectItem>
                  <SelectItem value="VIDEO_CALL">Video Call</SelectItem>
                  <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filter by date"
              />
            </div>
          </CardContent>
        </Card>

        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No appointments found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Get started by booking your first appointment"}
                    </p>
                    {!searchQuery &&
                      statusFilter === "all" &&
                      typeFilter === "all" && (
                        <BookAppointmentDialog onSuccess={fetchAppointments} />
                      )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={openCancelDialog}
                    onCheckIn={handleCheckIn}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar" className="mt-6">
            <AppointmentCalendar
              appointments={filteredAppointments}
              onAppointmentClick={(id) => window.location.href = `/appointments/${id}`}
              onDateSelect={(date) => setDateFilter(date)}
            />
          </TabsContent>
        </Tabs>

        {/* Cancel Appointment Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this appointment? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full border rounded-md p-2 text-sm"
                rows={3}
                placeholder="Please provide a reason..."
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-red-600 hover:bg-red-700"
              >
                Cancel Appointment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  )
}