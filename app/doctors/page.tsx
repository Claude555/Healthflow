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
import DoctorCard from "@/components/doctors/DoctorCard"
import AddDoctorDialog from "@/components/doctors/AddDoctorDialog"
import MainLayout from "@/components/layout/MainLayout"
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  Stethoscope,
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

interface Doctor {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  department?: string | null
  experience: number
  consultationFee: number
  isAvailable: boolean
  status: string
  averageRating?: string | null
  _count?: {
    appointments: number
    prescriptions: number
    assignedPatients: number
  }
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [specializationFilter, setSpecializationFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null)

  // Get unique specializations and departments from doctors
  const specializations = Array.from(
    new Set(doctors.map((d) => d.specialization))
  ).sort()
  const departments = Array.from(
    new Set(doctors.map((d) => d.department).filter(Boolean))
  ).sort()

  const fetchDoctors = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (specializationFilter !== "all")
        params.append("specialization", specializationFilter)
      if (departmentFilter !== "all")
        params.append("department", departmentFilter)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/doctors?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setDoctors(data)
      } else {
        toast.error(data.error || "Failed to fetch doctors")
      }
    } catch (error) {
      toast.error("Failed to fetch doctors")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
  }, [searchQuery, specializationFilter, departmentFilter, statusFilter])

  const handleDelete = async () => {
    if (!doctorToDelete) return

    try {
      const response = await fetch(`/api/doctors/${doctorToDelete}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete doctor")
      }

      toast.success("Doctor deleted successfully")
      fetchDoctors()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete doctor")
    } finally {
      setDeleteDialogOpen(false)
      setDoctorToDelete(null)
    }
  }

  const openDeleteDialog = (id: string) => {
    setDoctorToDelete(id)
    setDeleteDialogOpen(true)
  }

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Specialization",
      "Department",
      "Experience",
      "Consultation Fee",
      "Status",
      "Average Rating",
    ]

    const rows = doctors.map((d) => [
      d.name,
      d.email,
      d.phone,
      d.specialization,
      d.department || "",
      d.experience,
      d.consultationFee,
      d.status,
      d.averageRating || "N/A",
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
      `doctors_${new Date().toISOString().split("T")[0]}.csv`
    )
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Doctors list exported successfully")
  }

  // Add this temporarily to app/doctors/page.tsx
const fixSchedules = async () => {
  const response = await fetch("/api/doctors/fix-schedules", {
    method: "POST",
  })
  const data = await response.json()
  toast.success(data.message)
}

  const stats = {
    total: doctors.length,
    active: doctors.filter((d) => d.status === "ACTIVE").length,
    available: doctors.filter((d) => d.isAvailable).length,
    onLeave: doctors.filter((d) => d.status === "ON_LEAVE").length,
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
            <p className="text-gray-500 mt-1">
              Manage doctors and medical staff
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
            <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Doctor
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Doctors
              </CardTitle>
              <Stethoscope className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Doctors
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Available Now
              </CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.available}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                On Leave
              </CardTitle>
              <UserX className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onLeave}</div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={fixSchedules} variant="outline">
  Fix Schedules
</Button>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search doctors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={specializationFilter}
                onValueChange={setSpecializationFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Specializations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specializations</SelectItem>
                  {specializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept || ""}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Doctors List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : doctors.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No doctors found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ||
                  specializationFilter !== "all" ||
                  departmentFilter !== "all" ||
                  statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by adding your first doctor"}
                </p>
                {!searchQuery &&
                  specializationFilter === "all" &&
                  departmentFilter === "all" &&
                  statusFilter === "all" && (
                    <Button onClick={() => setAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Doctor
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onDelete={openDeleteDialog}
              />
            ))}
          </div>
        )}

        {/* Add Doctor Dialog */}
        <AddDoctorDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={fetchDoctors}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                doctor record. Consider marking the doctor as inactive instead.
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