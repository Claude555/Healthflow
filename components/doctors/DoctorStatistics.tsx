"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Calendar,
  FileText,
  Star,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
} from "lucide-react"

interface DoctorStatisticsProps {
  doctor: {
    _count: {
      appointments: number
      prescriptions: number
      assignedPatients: number
      reviews: number
    }
    averageRating?: string | null
    appointments?: any[]
  }
}

export default function DoctorStatistics({ doctor }: DoctorStatisticsProps) {
  // Calculate completed appointments
  const completedAppointments =
    doctor.appointments?.filter((a) => a.status === "COMPLETED").length || 0

  const completionRate =
    doctor._count.appointments > 0
      ? ((completedAppointments / doctor._count.appointments) * 100).toFixed(1)
      : "0"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Patients
          </CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {doctor._count.assignedPatients}
          </div>
          <p className="text-xs text-gray-500 mt-1">Assigned patients</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Appointments
          </CardTitle>
          <Calendar className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{doctor._count.appointments}</div>
          <p className="text-xs text-gray-500 mt-1">
            {completedAppointments} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Prescriptions
          </CardTitle>
          <FileText className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {doctor._count.prescriptions}
          </div>
          <p className="text-xs text-gray-500 mt-1">Written prescriptions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Rating
          </CardTitle>
          <Star className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {doctor.averageRating ? `${doctor.averageRating}/5.0` : "N/A"}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {doctor._count.reviews} reviews
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Completion Rate
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <p className="text-xs text-gray-500 mt-1">Appointment completion</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Performance
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {parseFloat(completionRate) >= 80 ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Excellent
              </Badge>
            ) : parseFloat(completionRate) >= 60 ? (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                Good
              </Badge>
            ) : (
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                Needs Improvement
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Based on completion rate</p>
        </CardContent>
      </Card>
    </div>
  )
}