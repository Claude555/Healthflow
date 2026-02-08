import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET all waitlist entries
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get("patientId")
    const doctorId = searchParams.get("doctorId")
    const statusParam = searchParams.get("status")

    const waitlistEntries = await prisma.appointmentWaitlist.findMany({
      where: {
        AND: [
          patientId ? { patientId } : {},
          doctorId ? { doctorId } : {},
          statusParam ? { status: statusParam as any } : {},
        ],
      },
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
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
      },
      orderBy: [
        {
          priority: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    })

    return NextResponse.json(waitlistEntries)
  } catch (error) {
    console.error("Error fetching waitlist:", error)
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    )
  }
}

// POST create waitlist entry
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { patientId, doctorId, preferredDate, preferredTime, reason, priority } = body

    if (!patientId || !doctorId) {
      return NextResponse.json(
        { error: "Patient ID and Doctor ID are required" },
        { status: 400 }
      )
    }

    // Check if already on waitlist
    const existing = await prisma.appointmentWaitlist.findFirst({
      where: {
        patientId,
        doctorId,
        status: "WAITING",
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Patient is already on the waitlist for this doctor" },
        { status: 400 }
      )
    }

    const waitlistEntry = await prisma.appointmentWaitlist.create({
      data: {
        patientId,
        doctorId,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTime,
        reason,
        priority: priority || "NORMAL",
        status: "WAITING",
      },
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
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
      },
    })

    return NextResponse.json(waitlistEntry, { status: 201 })
  } catch (error) {
    console.error("Error creating waitlist entry:", error)
    return NextResponse.json(
      { error: "Failed to create waitlist entry" },
      { status: 500 }
    )
  }
}