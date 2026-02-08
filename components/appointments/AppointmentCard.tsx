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
  X,
  CheckCircle,
  Clock,
  User,
  Stethoscope,
  Calendar,
  Video,
  Phone,
  AlertCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

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

interface AppointmentCardProps {
  appointment: Appointment
  onCancel: (id: string) => void
  onCheckIn?: (id: string) => void
  viewType?: "patient" | "doctor" | "all"
}

export default function AppointmentCard({
  appointment,
  onCancel,
  onCheckIn,
  viewType = "all",
}: AppointmentCardProps) {
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "CONFIRMED":
        return "bg-green-100 text-green-700 border-green-200"
      case "CHECKED_IN":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200"
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200"
      case "NO_SHOW":
        return "bg-gray-100 text-gray-700 border-gray-200"
      case "RESCHEDULED":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO_CALL":
        return <Video className="h-4 w-4" />
      case "PHONE_CALL":
        return <Phone className="h-4 w-4" />
      case "EMERGENCY":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Stethoscope className="h-4 w-4" />
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const isUpcoming = () => {
    const appointmentDateTime = new Date(
      `${appointment.appointmentDate.split("T")[0]}T${appointment.appointmentTime}`
    )
    return appointmentDateTime > new Date()
  }

  const canCheckIn = () => {
    const appointmentDateTime = new Date(
      `${appointment.appointmentDate.split("T")[0]}T${appointment.appointmentTime}`
    )
    const now = new Date()
    const timeDiff = appointmentDateTime.getTime() - now.getTime()
    const minutesDiff = timeDiff / (1000 * 60)

    // Can check in 15 minutes before appointment
    return (
      minutesDiff <= 15 &&
      minutesDiff >= -30 &&
      appointment.status === "SCHEDULED" &&
      !appointment.checkedInAt
    )
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Date/Time Badge */}
            <div className="flex flex-col items-center bg-blue-50 rounded-lg p-3 min-w-[80px]">
              <span className="text-xs text-blue-600 font-medium">
                {format(new Date(appointment.appointmentDate), "MMM")}
              </span>
              <span className="text-2xl font-bold text-blue-700">
                {format(new Date(appointment.appointmentDate), "dd")}
              </span>
              <span className="text-xs text-blue-600 font-medium">
                {appointment.appointmentTime}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Patient/Doctor Info based on view type */}
              {viewType !== "patient" && (
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10 border-2 border-blue-100">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm">
                      {getInitials(
                        appointment.patient.firstName,
                        appointment.patient.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {appointment.patient.firstName}{" "}
                      {appointment.patient.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appointment.patient.phone}
                    </p>
                  </div>
                </div>
              )}

              {viewType !== "doctor" && (
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    Dr. {appointment.doctor.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    • {appointment.doctor.specialization}
                  </span>
                </div>
              )}

              {/* Reason */}
              {appointment.reason && (
                <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                  <span className="font-medium">Reason:</span>{" "}
                  {appointment.reason}
                </p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className={getStatusColor(appointment.status)}>
                  {appointment.status.replace("_", " ")}
                </Badge>

                <Badge variant="outline" className="gap-1">
                  {getTypeIcon(appointment.type)}
                  <span>{appointment.type.replace("_", " ")}</span>
                </Badge>

                <Badge variant="outline" className={getPriorityColor(appointment.priority)}>
                  {appointment.priority}
                </Badge>

                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{appointment.duration} min</span>
                </Badge>

                {appointment.checkedInAt && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    Checked In
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canCheckIn() && onCheckIn && (
              <Button
                size="sm"
                onClick={() => onCheckIn(appointment.id)}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Check In
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/appointments/${appointment.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>

                {isUpcoming() &&
                  appointment.status !== "CANCELLED" &&
                  appointment.status !== "COMPLETED" && (
                    <>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/appointments/${appointment.id}/edit`)
                        }
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Reschedule
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onCancel(appointment.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </DropdownMenuItem>
                    </>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}