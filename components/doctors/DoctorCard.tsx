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
  Mail,
  Phone,
  Briefcase,
  Star,
  DollarSign,
  Calendar,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"

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

interface DoctorCardProps {
  doctor: Doctor
  onDelete: (id: string) => void
}

export default function DoctorCard({ doctor, onDelete }: DoctorCardProps) {
  const router = useRouter()

  const getInitials = (name: string) => {
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-200"
      case "INACTIVE":
        return "bg-gray-100 text-gray-700 border-gray-200"
      case "ON_LEAVE":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "TERMINATED":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-16 w-16 border-2 border-blue-100">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold text-lg">
                {getInitials(doctor.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  Dr. {doctor.name}
                </h3>
                <Badge
                  variant="outline"
                  className={getStatusColor(doctor.status)}
                >
                  {doctor.status.replace("_", " ")}
                </Badge>
                {doctor.isAvailable && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Available
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  {doctor.specialization}
                </span>
                {doctor.department && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-600">
                      {doctor.department}
                    </span>
                  </>
                )}
              </div>

              <div className="space-y-1 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{doctor.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{doctor.phone}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1.5 rounded-md">
                  <Briefcase className="h-3.5 w-3.5 text-purple-600" />
                  <span className="font-medium text-purple-700">
                    {doctor.experience} years exp
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1.5 rounded-md">
                  <DollarSign className="h-3.5 w-3.5 text-green-600" />
                  <span className="font-medium text-green-700">
                    ${doctor.consultationFee}
                  </span>
                </div>

                {doctor.averageRating && (
                  <div className="flex items-center gap-1.5 bg-yellow-50 px-2.5 py-1.5 rounded-md">
                    <Star className="h-3.5 w-3.5 text-yellow-600 fill-yellow-600" />
                    <span className="font-medium text-yellow-700">
                      {doctor.averageRating}
                    </span>
                  </div>
                )}

                {doctor._count && (
                  <>
                    <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1.5 rounded-md">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      <span className="font-medium text-blue-700">
                        {doctor._count.appointments} appointments
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1.5 rounded-md">
                      <Users className="h-3.5 w-3.5 text-indigo-600" />
                      <span className="font-medium text-indigo-700">
                        {doctor._count.assignedPatients} patients
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/doctors/${doctor.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/doctors/${doctor.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Doctor
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(doctor.id)}
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