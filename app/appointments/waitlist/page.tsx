"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AddToWaitlistDialog from "@/components/appointments/AddToWaitlistDialog"
import BookAppointmentDialog from "@/components/appointments/BookAppointmentDialog"
import MainLayout from "@/components/layout/MainLayout"
import { Clock, Search, Trash2, CheckCircle, Calendar } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
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

interface WaitlistEntry {
  id: string
  preferredDate?: string | null
  preferredTime?: string | null
  reason?: string | null
  priority: string
  status: string
  isNotified: boolean
  createdAt: string
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
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)

  const fetchWaitlist = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/appointments/waitlist?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setEntries(data)
      } else {
        toast.error(data.error || "Failed to fetch waitlist")
      }
    } catch (error) {
      toast.error("Failed to fetch waitlist")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWaitlist()
  }, [statusFilter])

  const handleDelete = async () => {
    if (!entryToDelete) return

    try {
      const response = await fetch(`/api/appointments/waitlist/${entryToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete entry")
      }

      toast.success("Removed from waitlist")
      fetchWaitlist()
    } catch (error: any) {
      toast.error(error.message || "Failed to remove from waitlist")
    } finally {
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
    }
  }

  const handleNotify = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/waitlist/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isNotified: true,
          status: "NOTIFIED",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to notify patient")
      }

      toast.success("Patient notified successfully")
      fetchWaitlist()
    } catch (error: any) {
      toast.error(error.message || "Failed to notify patient")
    }
  }

  const openDeleteDialog = (id: string) => {
    setEntryToDelete(id)
    setDeleteDialogOpen(true)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-700 border-red-200"
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "NORMAL":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "LOW":
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "WAITING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "NOTIFIED":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "SCHEDULED":
        return "bg-green-100 text-green-700 border-green-200"
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200"
      case "EXPIRED":
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const filteredEntries = entries.filter((entry) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      entry.patient.firstName.toLowerCase().includes(searchLower) ||
      entry.patient.lastName.toLowerCase().includes(searchLower) ||
      entry.doctor.name.toLowerCase().includes(searchLower)
    )
  })

  const stats = {
    total: entries.length,
    waiting: entries.filter((e) => e.status === "WAITING").length,
    notified: entries.filter((e) => e.status === "NOTIFIED").length,
    urgent: entries.filter((e) => e.priority === "URGENT").length,
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Appointment Waitlist
            </h1>
            <p className="text-gray-500 mt-1">
              Manage patients waiting for appointments
            </p>
          </div>
          <AddToWaitlistDialog onSuccess={fetchWaitlist} />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Waiting
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Waiting
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.waiting}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Notified
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notified}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Urgent
              </CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.urgent}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients or doctors..."
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
                  <SelectItem value="WAITING">Waiting</SelectItem>
                  <SelectItem value="NOTIFIED">Notified</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Waitlist Entries */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No waitlist entries
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No patients on the waitlist"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {entry.patient.firstName} {entry.patient.lastName}
                        </h3>
                        <Badge
                          variant="outline"
                          className={getPriorityColor(entry.priority)}
                        >
                          {entry.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getStatusColor(entry.status)}
                        >
                          {entry.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Doctor:</span> Dr.{" "}
                        {entry.doctor.name} - {entry.doctor.specialization}
                      </p>

                      {entry.preferredDate && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Preferred Date:</span>{" "}
                          {format(new Date(entry.preferredDate), "MMM dd, yyyy")}
                          {entry.preferredTime && ` at ${entry.preferredTime}`}
                        </p>
                      )}

                      {entry.reason && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Reason:</span>{" "}
                          {entry.reason}
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        Added on {format(new Date(entry.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.status === "WAITING" && !entry.isNotified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNotify(entry.id)}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Notify
                        </Button>
                      )}

                      <BookAppointmentDialog
                        preSelectedPatientId={entry.patient.id}
                        preSelectedDoctorId={entry.doctor.id}
                        onSuccess={fetchWaitlist}
                      />

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDeleteDialog(entry.id)}
                        className="gap-2 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from Waitlist</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this patient from the waitlist?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  )
}