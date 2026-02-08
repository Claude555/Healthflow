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
import { MoreVertical, Eye, Edit, Trash2, Mail, Phone, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

interface Patient {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone: string
  dateOfBirth: string
  gender: string
  bloodType?: string | null
  _count?: {
    appointments: number
    prescriptions: number
  }
}

interface PatientCardProps {
  patient: Patient
  onDelete: (id: string) => void
}

export default function PatientCard({ patient, onDelete }: PatientCardProps) {
  const router = useRouter()

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

  const getGenderColor = (gender: string) => {
    return gender === "MALE"
      ? "bg-blue-100 text-blue-700"
      : gender === "FEMALE"
      ? "bg-pink-100 text-pink-700"
      : "bg-purple-100 text-purple-700"
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-12 w-12 border-2 border-blue-100">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold">
                {getInitials(patient.firstName, patient.lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h3>
                <Badge className={getGenderColor(patient.gender)} variant="outline">
                  {patient.gender}
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                {patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{patient.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{getAge(patient.dateOfBirth)} years old</span>
                </div>
              </div>

              {patient.bloodType && (
                <Badge variant="outline" className="mt-2">
                  Blood Type: {patient.bloodType.replace("_", " ")}
                </Badge>
              )}

              {patient._count && (
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span>{patient._count.appointments} Appointments</span>
                  <span>{patient._count.prescriptions} Prescriptions</span>
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/patients/${patient.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/patients/${patient.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Patient
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(patient.id)}
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