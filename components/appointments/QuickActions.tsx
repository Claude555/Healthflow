"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Calendar,
  Clock,
  FileText,
  Mail,
  Phone,
  Printer,
  Video,
  MessageSquare,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"

interface QuickActionsProps {
  appointment: {
    id: string
    appointmentDate: string
    appointmentTime: string
    type: string
    status: string
    patient: {
      firstName: string
      lastName: string
      email?: string | null
      phone: string
    }
    doctor: {
      name: string
      email: string
      phone: string
    }
    meetingLink?: string | null
  }
}

export default function QuickActions({ appointment }: QuickActionsProps) {
  const handlePrintReceipt = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Appointment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            .label { font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HealthFlow</h1>
            <h2>Appointment Receipt</h2>
          </div>
          <div class="info">
            <p><span class="label">Patient:</span> ${appointment.patient.firstName} ${appointment.patient.lastName}</p>
            <p><span class="label">Doctor:</span> Dr. ${appointment.doctor.name}</p>
            <p><span class="label">Date:</span> ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
            <p><span class="label">Time:</span> ${appointment.appointmentTime}</p>
            <p><span class="label">Type:</span> ${appointment.type.replace("_", " ")}</p>
            <p><span class="label">Status:</span> ${appointment.status}</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing HealthFlow</p>
            <p>Printed on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
    
    toast.success("Receipt prepared for printing")
  }

  const handleSendEmail = () => {
    const subject = `Appointment Confirmation - ${new Date(appointment.appointmentDate).toLocaleDateString()}`
    const body = `Dear ${appointment.patient.firstName},\n\nThis is to confirm your appointment:\n\nDoctor: Dr. ${appointment.doctor.name}\nDate: ${new Date(appointment.appointmentDate).toLocaleDateString()}\nTime: ${appointment.appointmentTime}\n\nPlease arrive 10 minutes early.\n\nBest regards,\nHealthFlow Team`
    
    window.location.href = `mailto:${appointment.patient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    toast.success("Email client opened")
  }

  const handleSendSMS = () => {
    const message = `Appointment with Dr. ${appointment.doctor.name} on ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.appointmentTime}. Please arrive 10 minutes early.`
    
    window.location.href = `sms:${appointment.patient.phone}?body=${encodeURIComponent(message)}`
    toast.success("SMS app opened")
  }

  const handleJoinVideoCall = () => {
    if (appointment.meetingLink) {
      window.open(appointment.meetingLink, "_blank")
      toast.success("Opening video call...")
    } else {
      toast.error("No meeting link available")
    }
  }

  const handleCallPatient = () => {
    window.location.href = `tel:${appointment.patient.phone}`
  }

  const handleCallDoctor = () => {
    window.location.href = `tel:${appointment.doctor.phone}`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handlePrintReceipt}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </DropdownMenuItem>

        {appointment.patient.email && (
          <DropdownMenuItem onClick={handleSendEmail}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={handleSendSMS}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Send SMS
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCallPatient}>
          <Phone className="mr-2 h-4 w-4" />
          Call Patient
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCallDoctor}>
          <Phone className="mr-2 h-4 w-4" />
          Call Doctor
        </DropdownMenuItem>

        {appointment.type === "VIDEO_CALL" && appointment.meetingLink && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleJoinVideoCall}>
              <Video className="mr-2 h-4 w-4" />
              Join Video Call
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}