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
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, X, AlertTriangle } from "lucide-react"
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
  allergies?: string | null
}

interface Medication {
  medicineName: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

interface AddPrescriptionDialogProps {
  preSelectedPatientId?: string
  preSelectedDoctorId?: string
  onSuccess?: () => void
}

export default function AddPrescriptionDialog({
  preSelectedPatientId,
  preSelectedDoctorId,
  onSuccess,
}: AddPrescriptionDialogProps) {
  const [open, setOpen] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [medications, setMedications] = useState<Medication[]>([
    {
      medicineName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
  ])

  const [formData, setFormData] = useState({
    patientId: preSelectedPatientId || "",
    doctorId: preSelectedDoctorId || "",
    diagnosis: "",
    symptoms: "",
    instructions: "",
    validUntil: "",
  })

  const [selectedPatientAllergies, setSelectedPatientAllergies] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchDoctors()
      if (!preSelectedPatientId) {
        fetchPatients()
      }
    }
  }, [open])

  useEffect(() => {
    if (formData.patientId) {
      const patient = patients.find((p) => p.id === formData.patientId)
      setSelectedPatientAllergies(patient?.allergies || null)
    }
  }, [formData.patientId, patients])

  const fetchDoctors = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/doctors?status=ACTIVE")
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

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        medicineName: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ])
  }

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const updateMedication = (
    index: number,
    field: keyof Medication,
    value: string
  ) => {
    const updated = [...medications]
    updated[index][field] = value
    setMedications(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.patientId ||
      !formData.doctorId ||
      !formData.diagnosis ||
      medications.length === 0
    ) {
      toast.error("Please fill in all required fields and add at least one medication")
      return
    }

    // Validate medications
    const invalidMeds = medications.filter(
      (med) => !med.medicineName || !med.dosage || !med.frequency || !med.duration
    )
    if (invalidMeds.length > 0) {
      toast.error("Please complete all medication details")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          medications,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create prescription")
      }

      toast.success("Prescription created successfully")
      setOpen(false)
      if (onSuccess) onSuccess()

      // Reset form
      setFormData({
        patientId: preSelectedPatientId || "",
        doctorId: preSelectedDoctorId || "",
        diagnosis: "",
        symptoms: "",
        instructions: "",
        validUntil: "",
      })
      setMedications([
        {
          medicineName: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
        },
      ])
    } catch (error: any) {
      toast.error(error.message || "Failed to create prescription")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Prescription
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Prescription</DialogTitle>
          <DialogDescription>
            Write a new prescription for a patient
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

            {selectedPatientAllergies && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 text-sm">
                    Patient Allergies
                  </p>
                  <p className="text-yellow-800 text-sm">
                    {selectedPatientAllergies}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Diagnosis & Symptoms */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">
              Diagnosis & Symptoms
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">
                  Diagnosis <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) =>
                    setFormData({ ...formData, diagnosis: e.target.value })
                  }
                  placeholder="e.g., Acute Bronchitis"
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
                  placeholder="Describe patient symptoms..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Medications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-700">
                Medications <span className="text-red-500">*</span>
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMedication}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Medication
              </Button>
            </div>

            <div className="space-y-4">
              {medications.map((medication, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  {medications.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMedication(index)}
                      className="absolute top-2 right-2 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">Medication {index + 1}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>
                        Medicine Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={medication.medicineName}
                        onChange={(e) =>
                          updateMedication(index, "medicineName", e.target.value)
                        }
                        placeholder="e.g., Amoxicillin"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Dosage <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={medication.dosage}
                        onChange={(e) =>
                          updateMedication(index, "dosage", e.target.value)
                        }
                        placeholder="e.g., 500mg"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Frequency <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={medication.frequency}
                        onValueChange={(value) =>
                          updateMedication(index, "frequency", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Once daily">Once daily</SelectItem>
                          <SelectItem value="Twice daily">Twice daily</SelectItem>
                          <SelectItem value="Three times daily">
                            Three times daily
                          </SelectItem>
                          <SelectItem value="Four times daily">
                            Four times daily
                          </SelectItem>
                          <SelectItem value="Every 4 hours">
                            Every 4 hours
                          </SelectItem>
                          <SelectItem value="Every 6 hours">
                            Every 6 hours
                          </SelectItem>
                          <SelectItem value="Every 8 hours">
                            Every 8 hours
                          </SelectItem>
                          <SelectItem value="As needed">As needed</SelectItem>
                          <SelectItem value="Before meals">
                            Before meals
                          </SelectItem>
                          <SelectItem value="After meals">After meals</SelectItem>
                          <SelectItem value="At bedtime">At bedtime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Duration <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={medication.duration}
                        onValueChange={(value) =>
                          updateMedication(index, "duration", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3 days">3 days</SelectItem>
                          <SelectItem value="5 days">5 days</SelectItem>
                          <SelectItem value="7 days">7 days</SelectItem>
                          <SelectItem value="10 days">10 days</SelectItem>
                          <SelectItem value="14 days">14 days</SelectItem>
                          <SelectItem value="21 days">21 days</SelectItem>
                          <SelectItem value="30 days">30 days</SelectItem>
                          <SelectItem value="60 days">60 days</SelectItem>
                          <SelectItem value="90 days">90 days</SelectItem>
                          <SelectItem value="Until finished">
                            Until finished
                          </SelectItem>
                          <SelectItem value="Ongoing">Ongoing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Special Instructions</Label>
                      <Input
                        value={medication.instructions}
                        onChange={(e) =>
                          updateMedication(index, "instructions", e.target.value)
                        }
                        placeholder="e.g., Take with food, Avoid alcohol"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Instructions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">
              General Instructions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="instructions">
                  Instructions <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, instructions: e.target.value })
                  }
                  placeholder="General instructions for the patient..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
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
                  Creating...
                </>
              ) : (
                "Create Prescription"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}