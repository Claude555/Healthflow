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

    const { searchParams } = new URL(req.url)
    const doctorId = searchParams.get("doctorId")
    const date = searchParams.get("date")

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: "Doctor ID and date are required" },
        { status: 400 }
      )
    }

    // Get the day of week
    const appointmentDate = new Date(date)
    const dayOfWeekString = appointmentDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase()
    const dayOfWeek = dayOfWeekString as any

    // Get doctor's schedule for this day
    const schedule = await prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        dayOfWeek,
        isAvailable: true,
      },
    })

    if (!schedule) {
      return NextResponse.json({
        slots: [],
        message: "Doctor is not available on this day",
      })
    }

    // Get all booked appointments for this day
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: new Date(date),
        status: {
          notIn: ["CANCELLED", "NO_SHOW"],
        },
      },
      select: {
        appointmentTime: true,
        duration: true,
      },
    })

    // Generate all possible time slots
    const slots = generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      30 // 30-minute slots
    )

    // Filter out booked slots
    const availableSlots = slots.filter((slot) => {
      return !bookedAppointments.some((appointment) => {
        return isTimeSlotConflict(
          slot,
          appointment.appointmentTime,
          appointment.duration
        )
      })
    })

    return NextResponse.json({
      slots: availableSlots,
      schedule: {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
    })
  } catch (error) {
    console.error("Error fetching available slots:", error)
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 }
    )
  }
}

// Helper function to generate time slots
function generateTimeSlots(
  startTime: string,
  endTime: string,
  interval: number
): string[] {
  const slots: string[] = []
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  let currentHour = startHour
  let currentMinute = startMinute

  while (
    currentHour < endHour ||
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    const timeSlot = `${currentHour.toString().padStart(2, "0")}:${currentMinute
      .toString()
      .padStart(2, "0")}`
    slots.push(timeSlot)

    currentMinute += interval
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60)
      currentMinute = currentMinute % 60
    }
  }

  return slots
}

// Helper function to check if time slots conflict
function isTimeSlotConflict(
  slot: string,
  bookedTime: string,
  duration: number
): boolean {
  const [slotHour, slotMinute] = slot.split(":").map(Number)
  const [bookedHour, bookedMinute] = bookedTime.split(":").map(Number)

  const slotMinutes = slotHour * 60 + slotMinute
  const bookedStartMinutes = bookedHour * 60 + bookedMinute
  const bookedEndMinutes = bookedStartMinutes + duration

  // Check if slot falls within booked time range
  return slotMinutes >= bookedStartMinutes && slotMinutes < bookedEndMinutes
}