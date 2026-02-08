import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET doctor schedule
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

    const schedules = await prisma.doctorSchedule.findMany({
      where: { doctorId: id },
      orderBy: {
        dayOfWeek: "asc",
      },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching schedule:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    )
  }
}

// POST create/update schedule
export async function POST(
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
    const { schedules } = body

    // Delete existing schedules
    await prisma.doctorSchedule.deleteMany({
      where: { doctorId: id },
    })

    // Create new schedules
    const createdSchedules = await prisma.doctorSchedule.createMany({
      data: schedules.map((schedule: any) => ({
        doctorId: id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isAvailable: schedule.isAvailable,
      })),
    })

    return NextResponse.json({ success: true, count: createdSchedules.count })
  } catch (error) {
    console.error("Error updating schedule:", error)
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    )
  }
}