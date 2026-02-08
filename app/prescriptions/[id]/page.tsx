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
  Printer,
  Trash2,
  User,
  Stethoscope,
  Calendar,
  Mail,
  Phone,
  AlertTriangle,
  Pill,
  Clock,
  FileText,
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
    phone: string
    dateOfBirth: string
    gender: string
    bloodType?: string | null
    allergies?: string | null
    conditions?: string | null
  }
  doctor: {
    id: string
    name: string
    specialization: string
    email: string
    phone: string
    licenseNumber: string
  }
  medications: Array<{
    id: string
    medicineName: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string | null
  }>
  refills: Array<{
    id: string
    status: string
    requestedAt: string
    approvedAt?: string | null
  }>
}

export default function PrescriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchPrescription()
    }
  }, [params.id])

  const fetchPrescription = async () => {
    try {
      const response = await fetch(`/api/prescriptions/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setPrescription(data)
      } else {
        toast.error(data.error || "Failed to fetch prescription")
        router.push("/prescriptions")
      }
    } catch (error) {
      toast.error("Failed to fetch prescription")
      router.push("/prescriptions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/prescriptions/${params.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete prescription")
      }

      toast.success("Prescription deleted successfully")
      router.push("/prescriptions")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete prescription")
      setIsDeleting(false)
    }
  }

  const handlePrint = () => {
    window.open(`/api/prescriptions/${params.id}/print`, "_blank")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-200"
      case "COMPLETED":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200"
      case "EXPIRED":
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
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

  if (!prescription) {
    return null
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/prescriptions")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Prescription Details
              </h1>
              <p className="text-gray-500 mt-1">
                Issued on{" "}
                {format(new Date(prescription.prescriptionDate), "MMMM dd, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Prescription</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this prescription? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete Prescription"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              onClick={() => router.push(`/prescriptions/${prescription.id}/edit`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prescription Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Prescription Information
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={getStatusColor(prescription.status)}
                  >
                    {prescription.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Diagnosis</p>
                  <p className="font-medium text-gray-900">
                    {prescription.diagnosis}
                  </p>
                </div>

                {prescription.symptoms && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Symptoms</p>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
                      {prescription.symptoms}
                    </p>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Prescription Date
                  </p>
                  <p className="font-medium">
                    {format(
                      new Date(prescription.prescriptionDate),
                      "MMMM dd, yyyy"
                    )}
                  </p>
                </div>

                {prescription.validUntil && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Valid Until</p>
                    <p className="font-medium">
                      {format(
                        new Date(prescription.validUntil),
                        "MMMM dd, yyyy"
                      )}
                    </p>
                  </div>
                )}

                {prescription.aiSuggested && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-indigo-900 mb-1">
                      AI-Assisted Prescription
                    </p>
                    <p className="text-sm text-indigo-700">
                      This prescription was created with AI assistance
                    </p>
                  </div>
                )}

                {prescription.aiAnalysis && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900 mb-1">
                          Important Notice
                        </p>
                        <p className="text-sm text-yellow-800">
                          {prescription.aiAnalysis}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-purple-600" />
                  Medications ({prescription.medications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prescription.medications.map((medication, index) => (
                    <div
                      key={medication.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                            <span className="text-purple-700 font-semibold text-sm">
                              {index + 1}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900">
                            {medication.medicineName}
                          </h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Dosage</p>
                          <p className="font-medium text-gray-900">
                            {medication.dosage}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Frequency</p>
                          <p className="font-medium text-gray-900">
                            {medication.frequency}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duration</p>
                          <p className="font-medium text-gray-900">
                            {medication.duration}
                          </p>
                        </div>
                      </div>

                      {medication.instructions && (
                        <div className="mt-3 bg-blue-50 rounded p-3">
                          <p className="text-sm text-blue-900">
                            <span className="font-medium">
                              Special Instructions:
                            </span>{" "}
                            {medication.instructions}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* General Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>General Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {prescription.instructions}
                </p>
              </CardContent>
            </Card>

            {/* Refills */}
            {prescription.refills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    Refill History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prescription.refills.map((refill) => (
                      <div
                        key={refill.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            Requested on{" "}
                            {format(new Date(refill.requestedAt), "MMM dd, yyyy")}
                          </p>
                          {refill.approvedAt && (
                            <p className="text-sm text-gray-600">
                              Approved on{" "}
                              {format(new Date(refill.approvedAt), "MMM dd, yyyy")}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">{refill.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Patient Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-blue-100">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                      {getInitials(
                        prescription.patient.firstName,
                        prescription.patient.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {prescription.patient.firstName}{" "}
                      {prescription.patient.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {prescription.patient.gender} •{" "}
                      {new Date().getFullYear() -
                        new Date(prescription.patient.dateOfBirth).getFullYear()}{" "}
                      years
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  {prescription.patient.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">
                        {prescription.patient.email}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {prescription.patient.phone}
                    </span>
                  </div>

                  {prescription.patient.bloodType && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">
                        Blood Type:{" "}
                        {prescription.patient.bloodType.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>

                {(prescription.patient.allergies ||
                  prescription.patient.conditions) && (
                  <>
                    <Separator />

                    {prescription.patient.allergies && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Allergies
                        </p>
                        <p className="text-sm text-orange-700 bg-orange-50 rounded p-2">
                          {prescription.patient.allergies}
                        </p>
                      </div>
                    )}

                    {prescription.patient.conditions && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Medical Conditions
                        </p>
                        <p className="text-sm text-blue-700 bg-blue-50 rounded p-2">
                          {prescription.patient.conditions}
                        </p>
                      </div>
                    )}
                  </>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(`/patients/${prescription.patient.id}`)
                  }
                >
                  View Full Profile
                </Button>
              </CardContent>
            </Card>

            {/* Doctor Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-green-600" />
                  Prescribing Doctor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    Dr. {prescription.doctor.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {prescription.doctor.specialization}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {prescription.doctor.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {prescription.doctor.phone}
                    </span>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500">License Number</p>
                    <p className="font-medium text-gray-700">
                      {prescription.doctor.licenseNumber}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(`/doctors/${prescription.doctor.id}`)
                  }
                >
                  View Doctor Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}