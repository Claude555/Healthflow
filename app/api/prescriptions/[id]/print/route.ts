import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        medications: true,
      },
    })

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      )
    }

    // Generate HTML for printing
    const html = generatePrescriptionHTML(prescription)

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error generating prescription print:", error)
    return NextResponse.json(
      { error: "Failed to generate prescription" },
      { status: 500 }
    )
  }
}

function generatePrescriptionHTML(prescription: any): string {
  const medicationsList = prescription.medications
    .map(
      (med: any, index: number) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${med.medicineName}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${med.dosage}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${med.frequency}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${med.duration}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${med.instructions || "-"}</td>
      </tr>
    `
    )
    .join("")

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Prescription - ${prescription.patient.firstName} ${prescription.patient.lastName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .clinic-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
          }
          .rx-symbol {
            font-size: 48px;
            font-weight: bold;
            color: #2563eb;
            margin: 20px 0;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
            font-size: 14px;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #f3f4f6;
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            font-size: 12px;
          }
          .doctor-signature {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #000;
            width: 300px;
            float: right;
          }
          .footer {
            margin-top: 80px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #6b7280;
          }
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">HealthFlow Medical Center</div>
          <p style="margin: 5px 0; color: #6b7280;">123 Medical Plaza, Suite 100</p>
          <p style="margin: 5px 0; color: #6b7280;">Phone: (555) 123-4567 | Email: info@healthflow.com</p>
        </div>

        <div class="rx-symbol">℞</div>

        <div class="section">
          <div class="section-title">Patient Information</div>
          <p><strong>Name:</strong> ${prescription.patient.firstName} ${prescription.patient.lastName}</p>
          <p><strong>Date of Birth:</strong> ${new Date(prescription.patient.dateOfBirth).toLocaleDateString()}</p>
          <p><strong>Phone:</strong> ${prescription.patient.phone}</p>
          ${prescription.patient.allergies ? `<p style="color: #dc2626;"><strong>⚠ Allergies:</strong> ${prescription.patient.allergies}</p>` : ""}
        </div>

        <div class="section">
          <div class="section-title">Diagnosis</div>
          <p>${prescription.diagnosis}</p>
        </div>

        ${prescription.symptoms ? `
        <div class="section">
          <div class="section-title">Symptoms</div>
          <p>${prescription.symptoms}</p>
        </div>
        ` : ""}

        <div class="section">
          <div class="section-title">Medications Prescribed</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine Name</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${medicationsList}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">General Instructions</div>
          <p>${prescription.instructions}</p>
        </div>

        ${prescription.aiAnalysis ? `
        <div class="section" style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b;">
          <div class="section-title" style="color: #f59e0b;">⚠ Important Notice</div>
          <p style="margin: 0;">${prescription.aiAnalysis}</p>
        </div>
        ` : ""}

        <div class="doctor-signature">
          <p style="margin-bottom: 40px;"><strong>Dr. ${prescription.doctor.name}</strong></p>
          <p style="margin: 5px 0; font-size: 12px;">${prescription.doctor.specialization}</p>
          <p style="margin: 5px 0; font-size: 12px;">License: ${prescription.doctor.licenseNumber}</p>
          <p style="margin: 5px 0; font-size: 12px;">Date: ${new Date(prescription.prescriptionDate).toLocaleDateString()}</p>
        </div>

        <div style="clear: both;"></div>

        <div class="footer">
          <p>This is a computer-generated prescription. Signature not required.</p>
          <p>For any queries, please contact our clinic at (555) 123-4567</p>
          <p>Prescription ID: ${prescription.id}</p>
        </div>
      </body>
    </html>
  `
}