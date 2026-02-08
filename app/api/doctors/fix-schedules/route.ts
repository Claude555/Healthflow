import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DayOfWeek } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all doctors
    const doctors = await prisma.doctor.findMany({
      where: {
        status: "ACTIVE",
      },
    })

    const defaultSchedule: Array<{ dayOfWeek: string; startTime: string; endTime: string; isAvailable: boolean }> = [
      { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '13:00', isAvailable: true },
      { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '17:00', isAvailable: false },
    ]

    let created = 0

    for (const doctor of doctors) {
      for (const schedule of defaultSchedule) {
        try {
          await prisma.doctorSchedule.upsert({
            where: {
              doctorId_dayOfWeek: {
                doctorId: doctor.id,
                dayOfWeek: schedule.dayOfWeek as DayOfWeek,
              },
            },
            create: {
              doctorId: doctor.id,
              dayOfWeek: schedule.dayOfWeek as DayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              isAvailable: schedule.isAvailable,
            },
            update: {
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              isAvailable: schedule.isAvailable,
            },
          })
          created++
        } catch (error) {
          // Schedule already exists
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created/updated schedules for ${doctors.length} doctors (${created} total schedules)`,
    })
  } catch (error) {
    console.error("Error fixing schedules:", error)
    return NextResponse.json(
      { error: "Failed to fix schedules" },
      { status: 500 }
    )
  }
}