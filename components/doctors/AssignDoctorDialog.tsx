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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { UserPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"

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

interface AssignDoctorDialogProps {
  patientId: string
  onSuccess?: () => void
}

export default function AssignDoctorDialog({
  patientId,
  onSuccess,
}: AssignDoctorDialogProps) {
  const [open, setOpen] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    doctorId: "",
    isPrimary: false,
    notes: "",
  })

  useEffect(() => {
    if (open) {
      fetchDoctors()
    }
  }, [open])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.doctorId) {
      toast.error("Please select a doctor")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/patients/assign-doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign doctor")
      }

      toast.success("Doctor assigned successfully")
      setOpen(false)
      if (onSuccess) onSuccess()

      // Reset form
      setFormData({
        doctorId: "",
        isPrimary: false,
        notes: "",
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to assign doctor")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Assign Doctor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Doctor to Patient</DialogTitle>
          <DialogDescription>
            Select a doctor to assign to this patient
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="doctor">
              Doctor <span className="text-red-500">*</span>
            </Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <Select
                value={formData.doctorId}
                onValueChange={(value) =>
                  setFormData({ ...formData, doctorId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
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

          <div className="flex items-center justify-between space-x-2 border rounded-lg p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isPrimary">Primary Care Doctor</Label>
              <p className="text-sm text-gray-500">
                Set as the patient's primary care physician
              </p>
            </div>
            <Switch
              id="isPrimary"
              checked={formData.isPrimary}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isPrimary: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
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
                  Assigning...
                </>
              ) : (
                "Assign Doctor"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}