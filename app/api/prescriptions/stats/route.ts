import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all prescriptions
    const allPrescriptions = await prisma.prescription.findMany({
      include: {
        medications: true,
      },
    })

    // Active prescriptions
    const activePrescriptions = allPrescriptions.filter(
      (p) => p.status === "ACTIVE"
    ).length

    // This month's prescriptions
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthPrescriptions = allPrescriptions.filter(
      (p) => new Date(p.prescriptionDate) >= firstDayOfMonth
    ).length

    // Calculate average medications per prescription
    const totalMedications = allPrescriptions.reduce(
      (sum, p) => sum + p.medications.length,
      0
    )
    const avgMedications = allPrescriptions.length
      ? (totalMedications / allPrescriptions.length).toFixed(1)
      : "0"

    // Find most prescribed medication
    const medicationCounts: { [key: string]: number } = {}
    allPrescriptions.forEach((prescription) => {
      prescription.medications.forEach((med) => {
        medicationCounts[med.medicineName] =
          (medicationCounts[med.medicineName] || 0) + 1
      })
    })

    const topMedication = Object.entries(medicationCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || "N/A"

    return NextResponse.json({
      total: allPrescriptions.length,
      active: activePrescriptions,
      thisMonth: thisMonthPrescriptions,
      topMedication,
      avgMedicationsPerPrescription: parseFloat(avgMedications),
    })
  } catch (error) {
    console.error("Error fetching prescription stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}