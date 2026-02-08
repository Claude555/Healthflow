import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET single patient
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

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            doctor: {
              select: {
                name: true,
                specialization: true,
              },
            },
          },
          orderBy: {
            appointmentDate: "desc",
          },
        },
        prescriptions: {
          include: {
            doctor: {
              select: {
                name: true,
              },
            },
            medications: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            appointments: true,
            prescriptions: true,
          },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error("Error fetching patient:", error)
    return NextResponse.json(
      { error: "Failed to fetch patient" },
      { status: 500 }
    )
  }
}

// PUT update patient
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
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      bloodType,
      address,
      city,
      state,
      zipCode,
      allergies,
      conditions,
    } = body

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        bloodType,
        address,
        city,
        state,
        zipCode,
        allergies,
        conditions,
      },
    })

    return NextResponse.json(patient)
  } catch (error) {
    console.error("Error updating patient:", error)
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    )
  }
}

// DELETE patient
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

    // Check if patient has appointments or prescriptions
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            appointments: true,
            prescriptions: true,
          },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    if (
      patient._count.appointments > 0 ||
      patient._count.prescriptions > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete patient with existing appointments or prescriptions",
        },
        { status: 400 }
      )
    }

    await prisma.patient.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting patient:", error)
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    )
  }
}