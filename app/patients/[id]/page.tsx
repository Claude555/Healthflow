"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import MainLayout from "@/components/layout/MainLayout"
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Droplet,
  AlertCircle,
  FileText,
  Clock,
  User,
  Stethoscope,
  Trash2,
} from "lucide-react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Appointment {
  id: string
  appointmentDate: string
  status: string
  reason?: string | null
  notes?: string | null
  doctor: {
    name: string
    specialization?: string | null
  }
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
}

interface Prescription {
  id: string
  createdAt: string
  diagnosis?: string | null
  notes?: string | null
  doctor: {
    name: string
  }
  medications: Medication[]
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone: string
  dateOfBirth: string
  gender: string
  bloodType?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  allergies?: string | null
  conditions?: string | null
  appointments: Appointment[]
  prescriptions: Prescription[]
  _count: {
    appointments: number
    prescriptions: number
  }
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchPatient()
  }, [params.id])

  const fetchPatient = async () => {
    try {
      const response = await fetch(`/api/patients/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setPatient(data)
      } else {
        toast.error(data.error || "Failed to fetch patient")
        router.push("/patients")
      }
    } catch (error) {
      toast.error("Failed to fetch patient")
      router.push("/patients")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/patients/${params.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete patient")
      }

      toast.success("Patient deleted successfully")
      router.push("/patients")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete patient")
      setIsDeleting(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getAge = (dateOfBirth: string) => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200"
      case "SCHEDULED":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  if (!patient) {
    return null
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/patients")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Details</h1>
              <p className="text-gray-500 mt-1">View complete patient information</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Patient</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this patient? This action cannot be
                    undone and will permanently remove all patient data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete Patient"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              onClick={() => router.push(`/patients/${patient.id}/edit`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Patient
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Info Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <Avatar className="h-24 w-24 border-4 border-blue-100 mb-4">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-bold">
                      {getInitials(patient.firstName, patient.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <Badge
                    variant="outline"
                    className="mt-2 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {patient.gender}
                  </Badge>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-medium">{getAge(patient.dateOfBirth)} years old</p>
                    </div>
                  </div>

                  {patient.bloodType && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Droplet className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Blood Type</p>
                        <p className="font-medium">{patient.bloodType.replace("_", " ")}</p>
                      </div>
                    </div>
                  )}

                  {patient.email && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium break-all">{patient.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{patient.phone}</p>
                    </div>
                  </div>

                  {patient.address && (
                    <div className="flex items-start gap-3 text-gray-700">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">
                          {patient.address}
                          {patient.city && patient.state && (
                            <>
                              <br />
                              {patient.city}, {patient.state} {patient.zipCode}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Appointments</span>
                    <Badge variant="outline">{patient._count.appointments}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Prescriptions</span>
                    <Badge variant="outline">{patient._count.prescriptions}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medical Info & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Medical Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.allergies && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      Allergies
                    </h4>
                    <p className="text-gray-600 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      {patient.allergies}
                    </p>
                  </div>
                )}

                {patient.conditions && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">
                      Medical Conditions
                    </h4>
                    <p className="text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      {patient.conditions}
                    </p>
                  </div>
                )}

                {!patient.allergies && !patient.conditions && (
                  <p className="text-gray-500 text-center py-4">
                    No medical information recorded
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Appointment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Appointment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.appointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No appointments yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {patient.appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Stethoscope className="h-4 w-4 text-gray-400" />
                              <span className="font-semibold text-gray-900">
                                {appointment.doctor.name}
                              </span>
                            </div>
                            {appointment.doctor.specialization && (
                              <p className="text-sm text-gray-500">
                                {appointment.doctor.specialization}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={getStatusColor(appointment.status)}
                          >
                            {appointment.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(
                              new Date(appointment.appointmentDate),
                              "MMM dd, yyyy 'at' hh:mm a"
                            )}
                          </span>
                        </div>

                        {appointment.reason && (
                          <p className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">Reason:</span>{" "}
                            {appointment.reason}
                          </p>
                        )}

                        {appointment.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 rounded p-2 mt-2">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prescription History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Prescription History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.prescriptions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No prescriptions yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {patient.prescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="border rounded-lg p-4 bg-green-50/50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-semibold text-gray-900">
                                Dr. {prescription.doctor.name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {format(new Date(prescription.createdAt), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>

                        {prescription.diagnosis && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Diagnosis:
                            </p>
                            <p className="text-sm text-gray-600 bg-white rounded p-2">
                              {prescription.diagnosis}
                            </p>
                          </div>
                        )}

                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Medications:
                          </p>
                          <div className="space-y-2">
                            {prescription.medications.map((medication) => (
                              <div
                                key={medication.id}
                                className="bg-white rounded p-3 border border-green-200"
                              >
                                <p className="font-medium text-gray-900">
                                  {medication.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {medication.dosage} - {medication.frequency}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {prescription.notes && (
                          <div className="text-sm text-gray-600 bg-white rounded p-2">
                            <span className="font-medium">Notes:</span> {prescription.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}