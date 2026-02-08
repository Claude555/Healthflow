"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import QuickActions from "@/components/appointments/QuickActions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import MainLayout from "@/components/layout/MainLayout"
import {
  ArrowLeft,
  Edit,
  X,
  CheckCircle,
  Clock,
  User,
  Stethoscope,
  Calendar,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  FileText,
  Video,
  Trash2,
  Plus,
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
import { Textarea } from "@/components/ui/textarea"

interface Appointment {
  id: string
  appointmentDate: string
  appointmentTime: string
  duration: number
  status: string
  type: string
  priority: string
  reason: string
  symptoms?: string | null
  notes?: string | null
  diagnosis?: string | null
  isRecurring: boolean
  recurringPattern?: string | null
  recurringEndDate?: string | null
  meetingLink?: string | null
  checkedInAt?: string | null
  checkedOutAt?: string | null
  cancelledAt?: string | null
  cancelledBy?: string | null
  cancellationReason?: string | null
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
    consultationFee: number
  }
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchAppointment()
    }
  }, [params.id])

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setAppointment(data)
      } else {
        toast.error(data.error || "Failed to fetch appointment")
        router.push("/appointments")
      }
    } catch (error) {
      toast.error("Failed to fetch appointment")
      router.push("/appointments")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/appointments/${params.id}/checkin`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check in")
      }

      toast.success("Checked in successfully")
      fetchAppointment()
    } catch (error: any) {
      toast.error(error.message || "Failed to check in")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCheckOut = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/appointments/${params.id}/checkout`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check out")
      }

      toast.success("Appointment completed successfully")
      fetchAppointment()
    } catch (error: any) {
      toast.error(error.message || "Failed to check out")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/appointments/${params.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancelledBy: "user",
          cancellationReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel appointment")
      }

      toast.success("Appointment cancelled successfully")
      setCancelDialogOpen(false)
      fetchAppointment()
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel appointment")
    } finally {
      setIsProcessing(false)
    }
  }

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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const canCheckIn = () => {
    if (!appointment) return false
    const appointmentDateTime = new Date(
      `${appointment.appointmentDate.split("T")[0]}T${appointment.appointmentTime}`
    )
    const now = new Date()
    const timeDiff = appointmentDateTime.getTime() - now.getTime()
    const minutesDiff = timeDiff / (1000 * 60)

    return (
      minutesDiff <= 15 &&
      minutesDiff >= -30 &&
      appointment.status === "SCHEDULED" &&
      !appointment.checkedInAt
    )
  }

  const canCheckOut = () => {
    return appointment?.status === "CHECKED_IN" || appointment?.status === "IN_PROGRESS"
  }

  const isUpcoming = () => {
    if (!appointment) return false
    const appointmentDateTime = new Date(
      `${appointment.appointmentDate.split("T")[0]}T${appointment.appointmentTime}`
    )
    return appointmentDateTime > new Date()
  }

  const canCancel = () => {
    return (
      appointment?.status !== "CANCELLED" &&
      appointment?.status !== "COMPLETED" &&
      appointment?.status !== "NO_SHOW"
    )
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

  if (!appointment) {
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
              onClick={() => router.push("/appointments")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Appointment Details
              </h1>
              <p className="text-gray-500 mt-1">
                {format(new Date(appointment.appointmentDate), "EEEE, MMMM dd, yyyy")} at{" "}
                {appointment.appointmentTime}
              </p>
            </div>
          </div>

          
          {appointment.status === "COMPLETED" && (
            <Button
              onClick={() => router.push(`/prescriptions/new?appointmentId=${appointment.id}&patientId=${appointment.patient.id}&doctorId=${appointment.doctor.id}`)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Prescription
            </Button>
          )}

          <div className="flex items-center gap-3">
            {canCheckIn() && (
              <Button
                onClick={handleCheckIn}
                disabled={isProcessing}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Check In
              </Button>
            )}

            {canCheckOut() && (
              <Button
                onClick={handleCheckOut}
                disabled={isProcessing}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Complete Visit
              </Button>
            )}

            {isUpcoming() && canCancel() && (
              <>
                <Button
                  onClick={() => router.push(`/appointments/${appointment.id}/edit`)}
                  variant="outline"
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Reschedule
                </Button>
                <QuickActions appointment={appointment} />

                <AlertDialog
                  open={cancelDialogOpen}
                  onOpenChange={setCancelDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="gap-2 text-red-600">
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel this appointment?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Reason for cancellation (optional)
                      </label>
                      <Textarea
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Please provide a reason..."
                        rows={3}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        disabled={isProcessing}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Cancel Appointment
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Appointment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                    <p className="font-medium">
                      {format(new Date(appointment.appointmentDate), "MMM dd, yyyy")} at{" "}
                      {appointment.appointmentTime}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Duration</p>
                    <p className="font-medium">{appointment.duration} minutes</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <Badge variant="outline" className={getStatusColor(appointment.status)}>
                      {appointment.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Priority</p>
                    <Badge variant="outline" className={getPriorityColor(appointment.priority)}>
                      {appointment.priority}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Type</p>
                    <p className="font-medium">{appointment.type.replace("_", " ")}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Consultation Fee</p>
                    <p className="font-medium">${appointment.doctor.consultationFee}</p>
                  </div>
                </div>

                {appointment.isRecurring && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Recurring Appointment
                    </p>
                    <p className="text-sm text-blue-700">
                      Pattern: {appointment.recurringPattern}
                      {appointment.recurringEndDate &&
                        ` until ${format(new Date(appointment.recurringEndDate), "MMM dd, yyyy")}`}
                    </p>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-sm text-gray-500 mb-2">Reason for Visit</p>
                  <p className="text-gray-900">{appointment.reason}</p>
                </div>

                {appointment.symptoms && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Symptoms</p>
                    <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                      {appointment.symptoms}
                    </p>
                  </div>
                )}

                {appointment.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Additional Notes</p>
                    <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                      {appointment.notes}
                    </p>
                  </div>
                )}

                {appointment.diagnosis && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Diagnosis</p>
                    <p className="text-gray-900 bg-green-50 border border-green-200 rounded-lg p-3">
                      {appointment.diagnosis}
                    </p>
                  </div>
                )}

                {appointment.meetingLink && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Video Meeting Link</p>
                    <a
                      href={appointment.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <Video className="h-4 w-4" />
                      Join Video Call
                    </a>
                  </div>
                )}

                {appointment.cancelledAt && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-900 mb-1">
                      Cancelled on {format(new Date(appointment.cancelledAt), "MMM dd, yyyy")}
                    </p>
                    {appointment.cancellationReason && (
                      <p className="text-sm text-red-700">
                        Reason: {appointment.cancellationReason}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointment.checkedInAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Checked In</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(appointment.checkedInAt), "MMM dd, yyyy 'at' hh:mm a")}
                        </p>
                      </div>
                    </div>
                  )}

                  {appointment.checkedOutAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Completed</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(appointment.checkedOutAt), "MMM dd, yyyy 'at' hh:mm a")}
                        </p>
                      </div>
                    </div>
                  )}

                  {!appointment.checkedInAt && !appointment.checkedOutAt && (
                    <p className="text-gray-500 text-center py-4">No activity yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
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
                      {getInitials(appointment.patient.firstName, appointment.patient.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appointment.patient.gender} •{" "}
                      {new Date().getFullYear() -
                        new Date(appointment.patient.dateOfBirth).getFullYear()}{" "}
                      years
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  {appointment.patient.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{appointment.patient.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{appointment.patient.phone}</span>
                  </div>

                  {appointment.patient.bloodType && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">
                        Blood Type: {appointment.patient.bloodType.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>

                {(appointment.patient.allergies || appointment.patient.conditions) && (
                  <>
                    <Separator />

                    {appointment.patient.allergies && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Allergies</p>
                        <p className="text-sm text-orange-700 bg-orange-50 rounded p-2">
                          {appointment.patient.allergies}
                        </p>
                      </div>
                    )}

                    {appointment.patient.conditions && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Medical Conditions
                        </p>
                        <p className="text-sm text-blue-700 bg-blue-50 rounded p-2">
                          {appointment.patient.conditions}
                        </p>
                      </div>
                    )}
                  </>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/patients/${appointment.patient.id}`)}
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
                  Doctor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    Dr. {appointment.doctor.name}
                  </p>
                  <p className="text-sm text-gray-600">{appointment.doctor.specialization}</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{appointment.doctor.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{appointment.doctor.phone}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/doctors/${appointment.doctor.id}`)}
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