import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET all appointments
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get("patientId")
    const doctorId = searchParams.get("doctorId")
    const status = searchParams.get("status")
    const date = searchParams.get("date")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const type = searchParams.get("type")

    const appointments = await prisma.appointment.findMany({
      where: {
        AND: [
          patientId ? { patientId } : {},
          doctorId ? { doctorId } : {},
          status ? { status: status as any } : {},
          date
            ? {
                appointmentDate: {
                  gte: new Date(date),
                  lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
                },
              }
            : {},
          startDate && endDate
            ? {
                appointmentDate: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              }
            : {},
          type ? { type: type as any } : {},
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
            dateOfBirth: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        {
          appointmentDate: "asc",
        },
        {
          appointmentTime: "asc",
        },
      ],
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    )
  }
}

// POST create new appointment
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      duration,
      status,
      type,
      priority,
      reason,
      symptoms,
      notes,
      isRecurring,
      recurringPattern,
      recurringEndDate,
    } = body

    // Validation
    if (!patientId || !doctorId || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if doctor is available
    const appointmentDateTime = new Date(appointmentDate)
    const dayOfWeek = appointmentDateTime
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase() as any

    const doctorSchedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        isAvailable: true,
      },
    })

    if (!doctorSchedule) {
      return NextResponse.json(
        { error: "Doctor is not available on this day" },
        { status: 400 }
      )
    }

    // Check time availability
    if (
      appointmentTime < doctorSchedule.startTime ||
      appointmentTime >= doctorSchedule.endTime
    ) {
      return NextResponse.json(
        {
          error: `Doctor is only available from ${doctorSchedule.startTime} to ${doctorSchedule.endTime}`,
        },
        { status: 400 }
      )
    }

    // Check for conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        status: {
          notIn: ["CANCELLED", "NO_SHOW"],
        },
      },
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 400 }
      )
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        duration: parseInt(duration) || 30,
        status: status || "SCHEDULED",
        type: type || "CONSULTATION",
        priority: priority || "NORMAL",
        reason,
        symptoms,
        notes,
        isRecurring: isRecurring || false,
        recurringPattern,
        recurringEndDate: recurringEndDate ? new Date(recurringEndDate) : null,
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

    // If recurring, create future appointments
    if (isRecurring && recurringPattern && recurringEndDate) {
      await createRecurringAppointments(
        appointment.id,
        patientId,
        doctorId,
        new Date(appointmentDate),
        appointmentTime,
        duration || 30,
        recurringPattern,
        new Date(recurringEndDate),
        type,
        priority,
        reason,
        symptoms,
        notes
      )
    }

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error("Error creating appointment:", error)
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    )
  }
}

// Helper function to create recurring appointments
async function createRecurringAppointments(
  parentId: string,
  patientId: string,
  doctorId: string,
  startDate: Date,
  appointmentTime: string,
  duration: number,
  pattern: string,
  endDate: Date,
  type: string,
  priority: string,
  reason?: string,
  symptoms?: string,
  notes?: string
) {
  const appointments = []
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    // Calculate next date based on pattern
    switch (pattern) {
      case "DAILY":
        currentDate.setDate(currentDate.getDate() + 1)
        break
      case "WEEKLY":
        currentDate.setDate(currentDate.getDate() + 7)
        break
      case "BIWEEKLY":
        currentDate.setDate(currentDate.getDate() + 14)
        break
      case "MONTHLY":
        currentDate.setMonth(currentDate.getMonth() + 1)
        break
      default:
        return
    }

    if (currentDate > endDate) break

    // Check if doctor is available on this day
    const dayOfWeek = currentDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase() as any

    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        isAvailable: true,
      },
    })

    if (schedule) {
      const appointmentData: any = {
        patientId,
        doctorId,
        appointmentDate: new Date(currentDate),
        appointmentTime,
        duration,
        status: "SCHEDULED" as any,
        type: type as any,
        priority: priority as any,
        isRecurring: true,
        recurringPattern: pattern as any,
        parentAppointmentId: parentId,
      }

      if (reason !== undefined) appointmentData.reason = reason
      if (symptoms !== undefined) appointmentData.symptoms = symptoms
      if (notes !== undefined) appointmentData.notes = notes

      appointments.push(appointmentData)
    }
  }

  if (appointments.length > 0) {
    await prisma.appointment.createMany({
      data: appointments,
    })
  }
}