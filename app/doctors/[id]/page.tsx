"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import DoctorStatistics from "@/components/doctors/DoctorStatistics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MainLayout from "@/components/layout/MainLayout"
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Star,
  DollarSign,
  Users,
  FileText,
  Clock,
  Award,
  Languages,
  Building,
  Trash2,
  UserPlus,
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

interface DoctorSchedule {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface Shift {
  id: string
  date: string
  startTime: string
  endTime: string
  shiftType: string
  status: string
}

interface AssignedPatient {
  id: string
  isPrimary: boolean
  patient: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

interface Review {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  patient: {
    firstName: string
    lastName: string
  }
}

interface Doctor {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  licenseNumber: string
  qualification: string
  experience: number
  consultationFee: number
  dateOfBirth?: string | null
  gender?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  department?: string | null
  languages?: string | null
  bio?: string | null
  isAvailable: boolean
  role: string
  status: string
  averageRating?: string | null
  schedules: DoctorSchedule[]
  shifts: Shift[]
  assignedPatients: AssignedPatient[]
  reviews: Review[]
  _count: {
    appointments: number
    prescriptions: number
    assignedPatients: number
    reviews: number
  }
}

export default function DoctorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchDoctor()
    }
  }, [params.id])

  const fetchDoctor = async () => {
    try {
      const response = await fetch(`/api/doctors/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setDoctor(data)
      } else {
        toast.error(data.error || "Failed to fetch doctor")
        router.push("/doctors")
      }
    } catch (error) {
      toast.error("Failed to fetch doctor")
      router.push("/doctors")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/doctors/${params.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete doctor")
      }

      toast.success("Doctor deleted successfully")
      router.push("/doctors")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete doctor")
      setIsDeleting(false)
    }
  }

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

  const dayOrder = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  if (!doctor) {
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
              onClick={() => router.push("/doctors")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Doctor Details
              </h1>
              <p className="text-gray-500 mt-1">
                View complete doctor information
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
                  <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this doctor? This action
                    cannot be undone. Consider marking the doctor as inactive
                    instead.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete Doctor"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              onClick={() => router.push(`/doctors/${doctor.id}/edit`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Doctor
            </Button>
          </div>
        </div>

        <DoctorStatistics doctor={doctor} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor Info Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <Avatar className="h-24 w-24 border-4 border-blue-100 mb-4">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-bold">
                      {getInitials(doctor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Dr. {doctor.name}
                  </h2>
                  <p className="text-blue-600 font-medium mt-1">
                    {doctor.specialization}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant="outline"
                      className={getStatusColor(doctor.status)}
                    >
                      {doctor.status.replace("_", " ")}
                    </Badge>
                    {doctor.isAvailable && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700"
                      >
                        Available
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium break-all">{doctor.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{doctor.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <Award className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">License Number</p>
                      <p className="font-medium">{doctor.licenseNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="font-medium">{doctor.experience} years</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Consultation Fee</p>
                      <p className="font-medium">${doctor.consultationFee}</p>
                    </div>
                  </div>

                  {doctor.department && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <p className="font-medium">{doctor.department}</p>
                      </div>
                    </div>
                  )}

                  {doctor.languages && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Languages className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Languages</p>
                        <p className="font-medium">{doctor.languages}</p>
                      </div>
                    </div>
                  )}

                  {doctor.averageRating && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <div>
                        <p className="text-sm text-gray-500">Average Rating</p>
                        <p className="font-medium">
                          {doctor.averageRating} / 5.0
                        </p>
                      </div>
                    </div>
                  )}

                  {doctor.address && (
                    <div className="flex items-start gap-3 text-gray-700">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">
                          {doctor.address}
                          {doctor.city && doctor.state && (
                            <>
                              <br />
                              {doctor.city}, {doctor.state} {doctor.zipCode}
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
                    <span className="text-sm text-gray-600">
                      Total Appointments
                    </span>
                    <Badge variant="outline">
                      {doctor._count.appointments}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Prescriptions Written
                    </span>
                    <Badge variant="outline">
                      {doctor._count.prescriptions}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Assigned Patients
                    </span>
                    <Badge variant="outline">
                      {doctor._count.assignedPatients}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Reviews</span>
                    <Badge variant="outline">{doctor._count.reviews}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="patients">Patients</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Professional Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-600" />
                      Professional Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Qualification</p>
                        <p className="font-medium">{doctor.qualification}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="font-medium">{doctor.role}</p>
                      </div>
                    </div>
                    {doctor.bio && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Biography</p>
                        <p className="text-gray-700">{doctor.bio}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Shifts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      Upcoming Shifts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {doctor.shifts.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No upcoming shifts scheduled
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {doctor.shifts.map((shift) => (
                          <div
                            key={shift.id}
                            className="border rounded-lg p-3 hover:bg-gray-50"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {format(new Date(shift.date), "MMMM dd, yyyy")}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {shift.startTime} - {shift.endTime}
                                </p>
                              </div>
                              <Badge variant="outline">{shift.shiftType}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Weekly Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {doctor.schedules.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No schedule configured
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {dayOrder.map((day) => {
                          const schedule = doctor.schedules.find(
                            (s) => s.dayOfWeek === day
                          )
                          return (
                            <div
                              key={day}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <span className="font-medium text-gray-900 w-32">
                                {day.charAt(0) +
                                  day.slice(1).toLowerCase()}
                              </span>
                              {schedule ? (
                                <>
                                  <span className="text-gray-600">
                                    {schedule.startTime} - {schedule.endTime}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={
                                      schedule.isAvailable
                                        ? "bg-green-50 text-green-700"
                                        : "bg-gray-100 text-gray-700"
                                    }
                                  >
                                    {schedule.isAvailable
                                      ? "Available"
                                      : "Unavailable"}
                                  </Badge>
                                </>
                              ) : (
                                <span className="text-gray-400">
                                  Not scheduled
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Patients Tab */}
              <TabsContent value="patients">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Assigned Patients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {doctor.assignedPatients.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No patients assigned yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {doctor.assignedPatients.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() =>
                              router.push(`/patients/${assignment.patient.id}`)
                            }
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">
                                    {assignment.patient.firstName}{" "}
                                    {assignment.patient.lastName}
                                  </p>
                                  {assignment.isPrimary && (
                                    <Badge
                                      variant="outline"
                                      className="bg-blue-50 text-blue-700"
                                    >
                                      Primary
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {assignment.patient.email}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {assignment.patient.phone}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                      Patient Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {doctor.reviews.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No reviews yet
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {doctor.reviews.map((review) => (
                          <div key={review.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {review.patient.firstName}{" "}
                                  {review.patient.lastName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {format(
                                    new Date(review.createdAt),
                                    "MMM dd, yyyy"
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-gray-700 text-sm">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}