"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { toast } from "sonner"

interface Appointment {
  id: string
  appointmentDate: string
  appointmentTime: string
  status: string
  type: string
  patient: {
    firstName: string
    lastName: string
    phone: string
  }
  doctor: {
    name: string
    specialization: string
  }
}

interface PrintAppointmentListProps {
  appointments: Appointment[]
  title?: string
}

export default function PrintAppointmentList({
  appointments,
  title = "Appointment List",
}: PrintAppointmentListProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Could not open print window")
      return
    }

    const appointmentRows = appointments
      .map(
        (apt, index) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${new Date(apt.appointmentDate).toLocaleDateString()}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${apt.appointmentTime}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${apt.patient.firstName} ${apt.patient.lastName}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${apt.patient.phone}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">Dr. ${apt.doctor.name}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${apt.doctor.specialization}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${apt.type.replace("_", " ")}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${apt.status}</td>
        </tr>
      `
      )
      .join("")

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #f2f2f2;
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HealthFlow</h1>
            <h2>${title}</h2>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Phone</th>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${appointmentRows}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Total Appointments: ${appointments.length}</p>
            <p>HealthFlow Medical Center © ${new Date().getFullYear()}</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print()
      toast.success("Print dialog opened")
    }, 250)
  }

  return (
    <Button variant="outline" onClick={handlePrint} className="gap-2">
      <Printer className="h-4 w-4" />
      Print List
    </Button>
  )
}