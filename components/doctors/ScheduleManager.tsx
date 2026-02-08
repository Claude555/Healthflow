"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Clock, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

interface Schedule {
  dayOfWeek: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface ScheduleManagerProps {
  doctorId: string
}

const daysOfWeek = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]

export default function ScheduleManager({ doctorId }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchSchedule()
  }, [doctorId])

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}/schedule`)
      const data = await response.json()

      if (response.ok) {
        // Create a schedule entry for each day
        const fullSchedule = daysOfWeek.map((day) => {
          const existing = data.find((s: Schedule) => s.dayOfWeek === day)
          return (
            existing || {
              dayOfWeek: day,
              startTime: "09:00",
              endTime: "17:00",
              isAvailable: false,
            }
          )
        })
        setSchedules(fullSchedule)
      }
    } catch (error) {
      toast.error("Failed to fetch schedule")
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleChange = (
    day: string,
    field: keyof Schedule,
    value: any
  ) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.dayOfWeek === day
          ? { ...schedule, [field]: value }
          : schedule
      )
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/doctors/${doctorId}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schedules }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save schedule")
      }

      toast.success("Schedule updated successfully")
      setDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save schedule")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
          Weekly Schedule
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Edit Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Weekly Schedule</DialogTitle>
              <DialogDescription>
                Set the doctor's availability for each day of the week
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.dayOfWeek}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      {schedule.dayOfWeek.charAt(0) +
                        schedule.dayOfWeek.slice(1).toLowerCase()}
                    </Label>
                    <Switch
                      checked={schedule.isAvailable}
                      onCheckedChange={(checked) =>
                        handleScheduleChange(
                          schedule.dayOfWeek,
                          "isAvailable",
                          checked
                        )
                      }
                    />
                  </div>

                  {schedule.isAvailable && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Start Time</Label>
                        <Input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) =>
                            handleScheduleChange(
                              schedule.dayOfWeek,
                              "startTime",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">End Time</Label>
                        <Input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) =>
                            handleScheduleChange(
                              schedule.dayOfWeek,
                              "endTime",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Schedule
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div
              key={schedule.dayOfWeek}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <span className="font-medium text-gray-900 w-32">
                {schedule.dayOfWeek.charAt(0) +
                  schedule.dayOfWeek.slice(1).toLowerCase()}
              </span>
              {schedule.isAvailable ? (
                <>
                  <span className="text-gray-600">
                    {schedule.startTime} - {schedule.endTime}
                  </span>
                  <span className="text-green-600 text-sm font-medium">
                    Available
                  </span>
                </>
              ) : (
                <span className="text-gray-400">Not scheduled</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}