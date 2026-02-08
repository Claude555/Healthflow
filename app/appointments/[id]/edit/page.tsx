"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import MainLayout from "@/components/layout/MainLayout"
import { ArrowLeft, Loader2, Save, X } from "lucide-react"
import { toast } from "sonner"

interface AppointmentFormData {
  appointmentDate: string
  appointmentTime: string
  duration: string
  type: string
  priority: string
  reason: string
  symptoms: string
  notes: string
  diagnosis: string
  meetingLink: string
}

export default function EditAppointmentPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [doctorId, setDoctorId] = useState("")
  const [patientName, setPatientName] = useState("")
  const [doctorName, setDoctorName] = useState("")

  const [formData, setFormData] = useState<AppointmentFormData>({
    appointmentDate: "",
    appointmentTime: "",
    duration: "30",
    type: "CONSULTATION",
    priority: "NORMAL",
    reason: "",
    symptoms: "",
    notes: "",
    diagnosis: "",
    meetingLink: "",
  })

  useEffect(() => {
    if (params.id) {
      fetchAppointment()
    }
  }, [params.id])

  useEffect(() => {
    if (doctorId && formData.appointmentDate) {
      fetchAvailableSlots()
    }
  }, [doctorId, formData.appointmentDate])

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/appointments/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setFormData({
          appointmentDate: data.appointmentDate.split("T")[0],
          appointmentTime: data.appointmentTime,
          duration: data.duration.toString(),
          type: data.type,
          priority: data.priority,
          reason: data.reason,
          symptoms: data.symptoms || "",
          notes: data.notes || "",
          diagnosis: data.diagnosis || "",
          meetingLink: data.meetingLink || "",
        })
        setDoctorId(data.doctorId)
        setPatientName(`${data.patient.firstName} ${data.patient.lastName}`)
        setDoctorName(data.doctor.name)
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

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true)
    try {
      const response = await fetch(
        `/api/appointments/available-slots?doctorId=${doctorId}&date=${formData.appointmentDate}`
      )
      const data = await response.json()
      if (response.ok) {
        // Include current time slot in available slots
        const slots = [...data.slots]
        if (!slots.includes(formData.appointmentTime)) {
          slots.push(formData.appointmentTime)
          slots.sort()
        }
        setAvailableSlots(slots)
      }
    } catch (error) {
      toast.error("Failed to fetch available slots")
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch(`/api/appointments/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update appointment")
      }

      toast.success("Appointment updated successfully")
      router.push(`/appointments/${params.id}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to update appointment")
    } finally {
      setIsSaving(false)
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

  return (
    <MainLayout>
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/appointments/${params.id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Appointment
            </h1>
            <p className="text-gray-500 mt-1">
              Update appointment details
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient & Doctor Info (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment For</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Patient</Label>
                  <Input value={patientName} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>Doctor</Label>
                  <Input
                    value={`Dr. ${doctorName}`}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle>Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appointmentDate: e.target.value,
                      })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentTime">
                    Time <span className="text-red-500">*</span>
                  </Label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <Select
                      value={formData.appointmentTime}
                      onValueChange={(value) =>
                        setFormData({ ...formData, appointmentTime: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No slots available
                          </SelectItem>
                        ) : (
                          availableSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) =>
                      setFormData({ ...formData, duration: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Appointment Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONSULTATION">Consultation</SelectItem>
                      <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                      <SelectItem value="ROUTINE_CHECKUP">
                        Routine Checkup
                      </SelectItem>
                      <SelectItem value="IN_PERSON">In Person</SelectItem>
                      <SelectItem value="VIDEO_CALL">Video Call</SelectItem>
                      <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason for Visit <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="e.g., Annual checkup, Follow-up..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms</Label>
                <Textarea
                  id="symptoms"
                  value={formData.symptoms}
                  onChange={(e) =>
                    setFormData({ ...formData, symptoms: e.target.value })
                  }
                  placeholder="Describe any symptoms..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis (Optional)</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) =>
                    setFormData({ ...formData, diagnosis: e.target.value })
                  }
                  placeholder="Doctor's diagnosis..."
                  rows={3}
                />
              </div>

              {formData.type === "VIDEO_CALL" && (
                <div className="space-y-2">
                  <Label htmlFor="meetingLink">
                    Video Meeting Link (Optional)
                  </Label>
                  <Input
                    id="meetingLink"
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingLink: e.target.value })
                    }
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/appointments/${params.id}`)}
              disabled={isSaving}
              className="w-full sm:w-auto gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}