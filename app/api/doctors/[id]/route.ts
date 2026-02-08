import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET single doctor
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

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            appointmentDate: "desc",
          },
          take: 10,
        },
        prescriptions: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        schedules: {
          orderBy: {
            dayOfWeek: "asc",
          },
        },
        shifts: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          orderBy: {
            date: "asc",
          },
          take: 5,
        },
        assignedPatients: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        reviews: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            appointments: true,
            prescriptions: true,
            assignedPatients: true,
            reviews: true,
          },
        },
      },
    })

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
    }

    // Calculate average rating
    const totalRating = doctor.reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = doctor.reviews.length > 0 
      ? (totalRating / doctor.reviews.length).toFixed(1)
      : null

    return NextResponse.json({
      ...doctor,
      averageRating,
    })
  } catch (error) {
    console.error("Error fetching doctor:", error)
    return NextResponse.json(
      { error: "Failed to fetch doctor" },
      { status: 500 }
    )
  }
}

// PUT update doctor
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
      name,
      email,
      phone,
      specialization,
      licenseNumber,
      qualification,
      experience,
      consultationFee,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      department,
      languages,
      bio,
      isAvailable,
      role,
      status,
    } = body

    const doctor = await prisma.doctor.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        specialization,
        licenseNumber,
        qualification,
        experience: experience ? parseInt(experience) : undefined,
        consultationFee: consultationFee ? parseFloat(consultationFee) : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        city,
        state,
        zipCode,
        department,
        languages,
        bio,
        isAvailable,
        role,
        status,
      },
    })

    return NextResponse.json(doctor)
  } catch (error) {
    console.error("Error updating doctor:", error)
    return NextResponse.json(
      { error: "Failed to update doctor" },
      { status: 500 }
    )
  }
}

// DELETE doctor
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

    // Check if doctor has appointments or prescriptions
    const doctor = await prisma.doctor.findUnique({
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

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
    }

    if (doctor._count.appointments > 0 || doctor._count.prescriptions > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete doctor with existing appointments or prescriptions. Consider marking as inactive instead.",
        },
        { status: 400 }
      )
    }

    await prisma.doctor.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting doctor:", error)
    return NextResponse.json(
      { error: "Failed to delete doctor" },
      { status: 500 }
    )
  }
}