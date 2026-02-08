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

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    // Get appointments scheduled for tomorrow that haven't been reminded
    const appointmentsToRemind = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        status: {
          in: ["SCHEDULED", "CONFIRMED"],
        },
        reminderSent: false,
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            name: true,
            specialization: true,
          },
        },
      },
    })

    // Mark reminders as sent
    const reminderIds = appointmentsToRemind.map((apt) => apt.id)
    
    if (reminderIds.length > 0) {
      await prisma.appointment.updateMany({
        where: {
          id: {
            in: reminderIds,
          },
        },
        data: {
          reminderSent: true,
          reminderSentAt: new Date(),
        },
      })
    }

    // In a real app, you would send emails/SMS here
    // For now, we'll just return the appointments that would be reminded

    return NextResponse.json({
      success: true,
      message: `${appointmentsToRemind.length} reminder(s) sent`,
      appointments: appointmentsToRemind.map((apt) => ({
        id: apt.id,
        patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
        doctor: apt.doctor.name,
        date: apt.appointmentDate,
        time: apt.appointmentTime,
      })),
    })
  } catch (error) {
    console.error("Error sending reminders:", error)
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    )
  }
}