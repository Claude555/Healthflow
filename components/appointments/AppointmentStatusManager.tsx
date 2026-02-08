"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AppointmentStatusManagerProps {
  appointmentId: string
  currentStatus: string
  onStatusChange?: () => void
}

export default function AppointmentStatusManager({
  appointmentId,
  currentStatus,
  onStatusChange,
}: AppointmentStatusManagerProps) {
  const [open, setOpen] = useState(false)
  const [newStatus, setNewStatus] = useState(currentStatus)
  const [notes, setNotes] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const statusOptions = [
    { value: "SCHEDULED", label: "Scheduled", color: "bg-blue-100 text-blue-700" },
    { value: "CONFIRMED", label: "Confirmed", color: "bg-green-100 text-green-700" },
    { value: "CHECKED_IN", label: "Checked In", color: "bg-purple-100 text-purple-700" },
    { value: "IN_PROGRESS", label: "In Progress", color: "bg-orange-100 text-orange-700" },
    { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-700" },
    { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-700" },
    { value: "NO_SHOW", label: "No Show", color: "bg-gray-100 text-gray-700" },
    { value: "RESCHEDULED", label: "Rescheduled", color: "bg-yellow-100 text-yellow-700" },
  ]

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status")
      }

      toast.success("Appointment status updated successfully")
      setOpen(false)
      if (onStatusChange) onStatusChange()
    } catch (error: any) {
      toast.error(error.message || "Failed to update status")
    } finally {
      setIsUpdating(false)
    }
  }

  const getCurrentStatusColor = () => {
    return statusOptions.find((s) => s.value === currentStatus)?.color || "bg-gray-100 text-gray-700"
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Update Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Appointment Status</DialogTitle>
          <DialogDescription>
            Change the status of this appointment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Status</Label>
            <Badge variant="outline" className={getCurrentStatusColor()}>
              {statusOptions.find((s) => s.value === currentStatus)?.label}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStatus">
              New Status <span className="text-red-500">*</span>
            </Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant notes about this status change..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || newStatus === currentStatus}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}