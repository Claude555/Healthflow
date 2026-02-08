"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface TodayAppointment {
  id: string
  appointmentTime: string
  status: string
  patient: {
    firstName: string
    lastName: string
  }
  doctor: {
    name: string
  }
}

export default function AppointmentOverview() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<TodayAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTodayAppointments()
  }, [])

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const response = await fetch(`/api/appointments?date=${today}`)
      const data = await response.json()

      if (response.ok) {
        setAppointments(data.slice(0, 5)) // Show only first 5
      }
    } catch (error) {
      console.error("Failed to fetch appointments")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-700"
      case "CONFIRMED":
        return "bg-green-100 text-green-700"
      case "CHECKED_IN":
        return "bg-purple-100 text-purple-700"
      case "COMPLETED":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Today's Appointments
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/appointments")}
          className="gap-2"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No appointments scheduled for today
          </p>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/appointments/${appointment.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {appointment.appointmentTime}
                    </p>
                    <p className="text-sm text-gray-600">
                      {appointment.patient.firstName}{" "}
                      {appointment.patient.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Dr. {appointment.doctor.name}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}