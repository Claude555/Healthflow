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
import PrescriptionCard from "@/components/prescriptions/PrescriptionCard"
import PrescriptionStatsComponent from "@/components/prescriptions/PrescriptionStats"
import AddPrescriptionDialog from "@/components/prescriptions/AddPrescriptionDialog"
import MainLayout from "@/components/layout/MainLayout"
import {
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Pill,
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

interface Prescription {
  id: string
  diagnosis: string
  symptoms?: string | null
  instructions: string
  status: string
  prescriptionDate: string
  validUntil?: string | null
  aiSuggested: boolean
  aiAnalysis?: string | null
  patient: {
    id: string
    firstName: string
    lastName: string
    email?: string | null
  }
  doctor: {
    id: string
    name: string
    specialization: string
  }
  medications: Array<{
    id: string
    medicineName: string
    dosage: string
    frequency: string
    duration: string
  }>
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<string | null>(
    null
  )

  const fetchPrescriptions = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/prescriptions?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setPrescriptions(data)
      } else {
        toast.error(data.error || "Failed to fetch prescriptions")
      }
    } catch (error) {
      toast.error("Failed to fetch prescriptions")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrescriptions()
  }, [statusFilter])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchPrescriptions()
      }
    }, 500)

    return () => clearTimeout(debounce)
  }, [searchQuery])

  const handleDelete = async () => {
    if (!prescriptionToDelete) return

    try {
      const response = await fetch(
        `/api/prescriptions/${prescriptionToDelete}`,
        {
          method: "DELETE",
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete prescription")
      }

      toast.success("Prescription deleted successfully")
      fetchPrescriptions()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete prescription")
    } finally {
      setDeleteDialogOpen(false)
      setPrescriptionToDelete(null)
    }
  }

  const openDeleteDialog = (id: string) => {
    setPrescriptionToDelete(id)
    setDeleteDialogOpen(true)
  }

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Patient",
      "Doctor",
      "Diagnosis",
      "Medications",
      "Status",
    ]

    const rows = prescriptions.map((p) => [
      new Date(p.prescriptionDate).toLocaleDateString(),
      `${p.patient.firstName} ${p.patient.lastName}`,
      p.doctor.name,
      p.diagnosis,
      p.medications.map((m) => m.medicineName).join("; "),
      p.status,
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
      `prescriptions_${new Date().toISOString().split("T")[0]}.csv`
    )
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Prescriptions exported successfully")
  }

  const stats = {
    total: prescriptions.length,
    active: prescriptions.filter((p) => p.status === "ACTIVE").length,
    completed: prescriptions.filter((p) => p.status === "COMPLETED").length,
    cancelled: prescriptions.filter((p) => p.status === "CANCELLED").length,
    expired: prescriptions.filter((p) => p.status === "EXPIRED").length,
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
            <p className="text-gray-500 mt-1">
              Manage patient prescriptions and medications
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
                <DropdownMenuItem>Export to PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AddPrescriptionDialog onSuccess={fetchPrescriptions} />
          </div>
        </div>

        {/* Statistics Cards */}
        <PrescriptionStatsComponent />

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by diagnosis or symptoms..."
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
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : prescriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No prescriptions found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by creating your first prescription"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <AddPrescriptionDialog onSuccess={fetchPrescriptions} />
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {prescriptions.map((prescription) => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
                onDelete={openDeleteDialog}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Prescription</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this prescription? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  )
}