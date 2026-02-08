import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { patientId, doctorId, isPrimary, notes } = body

    if (!patientId || !doctorId) {
      return NextResponse.json(
        { error: "Patient ID and Doctor ID are required" },
        { status: 400 }
      )
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.patientDoctor.findUnique({
      where: {
        patientId_doctorId: {
          patientId,
          doctorId,
        },
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Doctor is already assigned to this patient" },
        { status: 400 }
      )
    }

    // If setting as primary, remove primary flag from other assignments
    if (isPrimary) {
      await prisma.patientDoctor.updateMany({
        where: {
          patientId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      })
    }

    // Create assignment
    const assignment = await prisma.patientDoctor.create({
      data: {
        patientId,
        doctorId,
        isPrimary: isPrimary || false,
        notes,
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true,
          },
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error("Error assigning doctor:", error)
    return NextResponse.json(
      { error: "Failed to assign doctor" },
      { status: 500 }
    )
  }
}