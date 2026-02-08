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
import { Badge } from "@/components/ui/badge"
import MainLayout from "@/components/layout/MainLayout"
import { ArrowLeft, Loader2, Save, X, Plus, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Medication {
  medicineName: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

interface FormData {
  diagnosis: string
  symptoms: string
  instructions: string
  status: string
  validUntil: string
}

export default function EditPrescriptionPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [patientName, setPatientName] = useState("")
  const [doctorName, setDoctorName] = useState("")
  const [patientAllergies, setPatientAllergies] = useState<string | null>(null)

  const [medications, setMedications] = useState<Medication[]>([])
  const [formData, setFormData] = useState<FormData>({
    diagnosis: "",
    symptoms: "",
    instructions: "",
    status: "ACTIVE",
    validUntil: "",
  })

  useEffect(() => {
    if (params.id) {
      fetchPrescription()
    }
  }, [params.id])

  const fetchPrescription = async () => {
    try {
      const response = await fetch(`/api/prescriptions/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setFormData({
          diagnosis: data.diagnosis,
          symptoms: data.symptoms || "",
          instructions: data.instructions,
          status: data.status,
          validUntil: data.validUntil ? data.validUntil.split("T")[0] : "",
        })
        setMedications(
          data.medications.map((med: any) => ({
            medicineName: med.medicineName,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions || "",
          }))
        )
        setPatientName(`${data.patient.firstName} ${data.patient.lastName}`)
        setDoctorName(data.doctor.name)
        setPatientAllergies(data.patient.allergies)
      } else {
        toast.error(data.error || "Failed to fetch prescription")
        router.push("/prescriptions")
      }
    } catch (error) {
      toast.error("Failed to fetch prescription")
      router.push("/prescriptions")
    } finally {
      setIsLoading(false)
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

    if (!formData.diagnosis || medications.length === 0) {
      toast.error("Please provide diagnosis and at least one medication")
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
      const response = await fetch(`/api/prescriptions/${params.id}`, {
        method: "PUT",
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
        throw new Error(data.error || "Failed to update prescription")
      }

      toast.success("Prescription updated successfully")
      router.push(`/prescriptions/${params.id}`)
    } catch (error: any) {
      toast.error(error.message || "Failed to update prescription")
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
            onClick={() => router.push(`/prescriptions/${params.id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Prescription
            </h1>
            <p className="text-gray-500 mt-1">Update prescription details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient & Doctor Info (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle>Prescription For</CardTitle>
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

              {patientAllergies && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900 text-sm">
                      Patient Allergies
                    </p>
                    <p className="text-yellow-800 text-sm">{patientAllergies}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diagnosis & Symptoms */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis & Symptoms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Medications <span className="text-red-500">*</span>
                </CardTitle>
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
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Instructions & Status */}
          <Card>
            <CardHeader>
              <CardTitle>General Instructions & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
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
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/prescriptions/${params.id}`)}
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