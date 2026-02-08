"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Switch } from "@/components/ui/switch"
import { Calendar as CalendarIcon, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface Doctor {
  id: string
  name: string
  specialization: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

interface BookAppointmentDialogProps {
  preSelectedPatientId?: string
  preSelectedDoctorId?: string
  onSuccess?: () => void
}

export default function BookAppointmentDialog({
  preSelectedPatientId,
  preSelectedDoctorId,
  onSuccess,
}: BookAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const [formData, setFormData] = useState({
    patientId: preSelectedPatientId || "",
    doctorId: preSelectedDoctorId || "",
    appointmentDate: "",
    appointmentTime: "",
    duration: "30",
    type: "IN_PERSON",
    priority: "NORMAL",
    reason: "",
    symptoms: "",
    notes: "",
    isRecurring: false,
    recurringPattern: "WEEKLY",
    recurringEndDate: "",
  })

  useEffect(() => {
    if (open) {
      fetchDoctors()
      if (!preSelectedPatientId) {
        fetchPatients()
      }
    }
  }, [open])

  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      fetchAvailableSlots()
    }
  }, [formData.doctorId, formData.appointmentDate])

  const fetchDoctors = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/doctors?status=ACTIVE&isAvailable=true")
      const data = await response.json()
      if (response.ok) {
        setDoctors(data)
      }
    } catch (error) {
      toast.error("Failed to fetch doctors")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients")
      const data = await response.json()
      if (response.ok) {
        setPatients(data)
      }
    } catch (error) {
      toast.error("Failed to fetch patients")
    }
  }

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true)
    try {
      const response = await fetch(
        `/api/appointments/available-slots?doctorId=${formData.doctorId}&date=${formData.appointmentDate}`
      )
      const data = await response.json()
      if (response.ok) {
        setAvailableSlots(data.slots)
      }
    } catch (error) {
      toast.error("Failed to fetch available slots")
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to book appointment")
      }

      toast.success("Appointment booked successfully")
      setOpen(false)
      if (onSuccess) onSuccess()

      // Reset form
      setFormData({
        patientId: preSelectedPatientId || "",
        doctorId: preSelectedDoctorId || "",
        appointmentDate: "",
        appointmentTime: "",
        duration: "30",
        type: "IN_PERSON",
        priority: "NORMAL",
        reason: "",
        symptoms: "",
        notes: "",
        isRecurring: false,
        recurringPattern: "WEEKLY",
        recurringEndDate: "",
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to book appointment")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Book Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book New Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment for a patient
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient & Doctor Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">
              Patient & Doctor
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {!preSelectedPatientId && (
                <div className="space-y-2">
                  <Label htmlFor="patient">
                    Patient <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.patientId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, patientId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="doctor">
                  Doctor <span className="text-red-500">*</span>
                </Label>
                {isLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <Select
                    value={formData.doctorId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, doctorId: value })
                    }
                    disabled={!!preSelectedDoctorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">
              Date & Time
            </h3>
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
                    setFormData({ ...formData, appointmentDate: e.target.value })
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
                    disabled={!formData.doctorId || !formData.appointmentDate}
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
                    <SelectItem value="IN_PERSON">In Person</SelectItem>
                    <SelectItem value="VIDEO_CALL">Video Call</SelectItem>
                    <SelectItem value="PHONE_CALL">Phone Call</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                    <SelectItem value="CONSULTATION">Consultation</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
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
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">
              Appointment Details
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Visit</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="e.g., Annual checkup, Follow-up..."
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
            </div>
          </div>

          {/* Recurring Appointments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2 border rounded-lg p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isRecurring">Recurring Appointment</Label>
                <p className="text-sm text-gray-500">
                  Create multiple appointments with a pattern
                </p>
              </div>
              <Switch
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRecurring: checked })
                }
              />
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                <div className="space-y-2">
                  <Label htmlFor="recurringPattern">Pattern</Label>
                  <Select
                    value={formData.recurringPattern}
                    onValueChange={(value) =>
                      setFormData({ ...formData, recurringPattern: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="BIWEEKLY">Biweekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurringEndDate">End Date</Label>
                  <Input
                    id="recurringEndDate"
                    type="date"
                    value={formData.recurringEndDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurringEndDate: e.target.value,
                      })
                    }
                    min={formData.appointmentDate}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Book Appointment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}