import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET single prescription
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
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            bloodType: true,
            allergies: true,
            conditions: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            email: true,
            phone: true,
            licenseNumber: true,
          },
        },
        medications: {
          orderBy: {
            createdAt: "asc",
          },
        },
        refills: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(prescription)
  } catch (error) {
    console.error("Error fetching prescription:", error)
    return NextResponse.json(
      { error: "Failed to fetch prescription" },
      { status: 500 }
    )
  }
}

// PUT update prescription
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()

    const {
      diagnosis,
      symptoms,
      instructions,
      status,
      validUntil,
      medications,
    } = body

    // If medications are being updated, delete old ones and create new ones
    if (medications) {
      await prisma.prescriptionMedicine.deleteMany({
        where: { prescriptionId: id },
      })
    }

    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        diagnosis,
        symptoms,
        instructions,
        status,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        medications: medications
          ? {
              create: medications.map((med: any) => ({
                medicineName: med.medicineName,
                dosage: med.dosage,
                frequency: med.frequency,
                duration: med.duration,
                instructions: med.instructions,
              })),
            }
          : undefined,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
        medications: true,
      },
    })

    return NextResponse.json(prescription)
  } catch (error) {
    console.error("Error updating prescription:", error)
    return NextResponse.json(
      { error: "Failed to update prescription" },
      { status: 500 }
    )
  }
}

// DELETE prescription
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    await prisma.prescription.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting prescription:", error)
    return NextResponse.json(
      { error: "Failed to delete prescription" },
      { status: 500 }
    )
  }
}