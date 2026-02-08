import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, subDays, startOfDay } from "date-fns"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") || "30")

    // Get appointments for the last N days
    const startDate = startOfDay(subDays(new Date(), days))
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startDate,
        },
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true,
          },
        },
      },
    })

    // Group by date
    const appointmentsByDate: { [key: string]: number } = {}
    const statusByDate: {
      [key: string]: {
        completed: number
        cancelled: number
        scheduled: number
      }
    } = {}

    appointments.forEach((apt) => {
      const dateKey = format(new Date(apt.appointmentDate), "yyyy-MM-dd")

      appointmentsByDate[dateKey] = (appointmentsByDate[dateKey] || 0) + 1

      if (!statusByDate[dateKey]) {
        statusByDate[dateKey] = { completed: 0, cancelled: 0, scheduled: 0 }
      }

      if (apt.status === "COMPLETED") {
        statusByDate[dateKey].completed++
      } else if (apt.status === "CANCELLED") {
        statusByDate[dateKey].cancelled++
      } else {
        statusByDate[dateKey].scheduled++
      }
    })

    // Generate daily data array
    const dailyData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateKey = format(date, "yyyy-MM-dd")
      const displayDate = format(date, "MMM dd")

      dailyData.push({
        date: displayDate,
        fullDate: dateKey,
        total: appointmentsByDate[dateKey] || 0,
        completed: statusByDate[dateKey]?.completed || 0,
        cancelled: statusByDate[dateKey]?.cancelled || 0,
        scheduled: statusByDate[dateKey]?.scheduled || 0,
      })
    }

    // Appointments by type
    const typeDistribution = appointments.reduce((acc, apt) => {
      acc[apt.type] = (acc[apt.type] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    // Appointments by status
    const statusDistribution = appointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    // Appointments by doctor
    const doctorDistribution: { [key: string]: number } = {}
    appointments.forEach((apt) => {
      const doctorName = apt.doctor.name
      doctorDistribution[doctorName] = (doctorDistribution[doctorName] || 0) + 1
    })

    // Top doctors
    const topDoctors = Object.entries(doctorDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    // Peak hours analysis
    const hourDistribution: { [key: number]: number } = {}
    appointments.forEach((apt) => {
      const hour = parseInt(apt.appointmentTime.split(":")[0])
      hourDistribution[hour] = (hourDistribution[hour] || 0) + 1
    })

    const peakHours = Object.entries(hourDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({
        hour: `${hour}:00`,
        count,
      }))

    return NextResponse.json({
      dailyData,
      typeDistribution: Object.entries(typeDistribution).map(([type, count]) => ({
        type,
        count,
      })),
      statusDistribution: Object.entries(statusDistribution).map(
        ([status, count]) => ({
          status,
          count,
        })
      ),
      topDoctors,
      peakHours,
      summary: {
        total: appointments.length,
        avgPerDay: Math.round(appointments.length / days),
      },
    })
  } catch (error) {
    console.error("Error fetching appointment analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}