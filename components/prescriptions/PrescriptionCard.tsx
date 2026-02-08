"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Printer,
  FileText,
  User,
  Stethoscope,
  Calendar,
  Pill,
  AlertTriangle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

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

interface PrescriptionCardProps {
  prescription: Prescription
  onDelete: (id: string) => void
}

export default function PrescriptionCard({
  prescription,
  onDelete,
}: PrescriptionCardProps) {
  const router = useRouter()

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

  const handlePrint = () => {
    window.open(`/api/prescriptions/${prescription.id}/print`, "_blank")
  }

  const isExpired = () => {
    if (!prescription.validUntil) return false
    return new Date(prescription.validUntil) < new Date()
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Date Badge */}
            <div className="flex flex-col items-center bg-blue-50 rounded-lg p-3 min-w-[80px]">
              <span className="text-xs text-blue-600 font-medium">
                {format(new Date(prescription.prescriptionDate), "MMM")}
              </span>
              <span className="text-2xl font-bold text-blue-700">
                {format(new Date(prescription.prescriptionDate), "dd")}
              </span>
              <span className="text-xs text-blue-600 font-medium">
                {format(new Date(prescription.prescriptionDate), "yyyy")}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Patient Info */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10 border-2 border-purple-100">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white text-sm">
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
                    {prescription.patient.email}
                  </p>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-900">
                  Dr. {prescription.doctor.name}
                </span>
                <span className="text-sm text-gray-500">
                  • {prescription.doctor.specialization}
                </span>
              </div>

              {/* Diagnosis */}
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Diagnosis:
                </p>
                <p className="text-gray-900 line-clamp-2">
                  {prescription.diagnosis}
                </p>
              </div>

              {/* Medications */}
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Medications ({prescription.medications.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {prescription.medications.slice(0, 3).map((med) => (
                    <Badge
                      key={med.id}
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-200"
                    >
                      <Pill className="h-3 w-3 mr-1" />
                      {med.medicineName}
                    </Badge>
                  ))}
                  {prescription.medications.length > 3 && (
                    <Badge variant="outline" className="bg-gray-50">
                      +{prescription.medications.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge
                  variant="outline"
                  className={getStatusColor(prescription.status)}
                >
                  {prescription.status}
                </Badge>

                {prescription.aiSuggested && (
                  <Badge
                    variant="outline"
                    className="bg-indigo-50 text-indigo-700 border-indigo-200"
                  >
                    AI Suggested
                  </Badge>
                )}

                {isExpired() && (
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200"
                  >
                    Expired
                  </Badge>
                )}

                {prescription.validUntil && !isExpired() && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Valid until{" "}
                    {format(new Date(prescription.validUntil), "MMM dd, yyyy")}
                  </Badge>
                )}

                {prescription.aiAnalysis && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Warnings
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/prescriptions/${prescription.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Prescription
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/prescriptions/${prescription.id}/edit`)
                }
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(prescription.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}