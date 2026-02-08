import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format, subDays, startOfDay, startOfMonth, subMonths } from "date-fns"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "daily" // daily, monthly

    if (period === "monthly") {
      // Monthly revenue for the last 12 months
      const monthlyData = []
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i))
        const monthEnd = startOfMonth(subMonths(new Date(), i - 1))

        const appointments = await prisma.appointment.findMany({
          where: {
            status: "COMPLETED",
            appointmentDate: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
          include: {
            doctor: {
              select: {
                consultationFee: true,
              },
            },
          },
        })

        const revenue = appointments.reduce(
          (sum, apt) => sum + (apt.doctor.consultationFee || 0),
          0
        )

        monthlyData.push({
          month: format(monthStart, "MMM yyyy"),
          revenue: Math.round(revenue),
          appointments: appointments.length,
        })
      }

      return NextResponse.json({ monthlyData })
    } else {
      // Daily revenue for the last 30 days
      const days = 30
      const startDate = startOfDay(subDays(new Date(), days))

      const appointments = await prisma.appointment.findMany({
        where: {
          status: "COMPLETED",
          appointmentDate: {
            gte: startDate,
          },
        },
        include: {
          doctor: {
            select: {
              name: true,
              consultationFee: true,
              specialization: true,
            },
          },
        },
      })

      // Group by date
      const revenueByDate: { [key: string]: { revenue: number; count: number } } = {}

      appointments.forEach((apt) => {
        const dateKey = format(new Date(apt.appointmentDate), "yyyy-MM-dd")
        if (!revenueByDate[dateKey]) {
          revenueByDate[dateKey] = { revenue: 0, count: 0 }
        }
        revenueByDate[dateKey].revenue += apt.doctor.consultationFee || 0
        revenueByDate[dateKey].count++
      })

      const dailyData = []
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateKey = format(date, "yyyy-MM-dd")
        const displayDate = format(date, "MMM dd")

        dailyData.push({
          date: displayDate,
          revenue: Math.round(revenueByDate[dateKey]?.revenue || 0),
          appointments: revenueByDate[dateKey]?.count || 0,
        })
      }

      // Revenue by doctor
      const doctorRevenue: { [key: string]: number } = {}
      appointments.forEach((apt) => {
        const doctorName = apt.doctor.name
        doctorRevenue[doctorName] =
          (doctorRevenue[doctorName] || 0) + (apt.doctor.consultationFee || 0)
      })

      const topDoctorsByRevenue = Object.entries(doctorRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, revenue]) => ({
          name,
          revenue: Math.round(revenue),
        }))

      // Revenue by specialization
      const specializationRevenue: { [key: string]: number } = {}
      appointments.forEach((apt) => {
        const spec = apt.doctor.specialization
        specializationRevenue[spec] =
          (specializationRevenue[spec] || 0) + (apt.doctor.consultationFee || 0)
      })

      const revenueBySpecialization = Object.entries(specializationRevenue)
        .sort((a, b) => b[1] - a[1])
        .map(([specialization, revenue]) => ({
          specialization,
          revenue: Math.round(revenue),
        }))

      const totalRevenue = appointments.reduce(
        (sum, apt) => sum + (apt.doctor.consultationFee || 0),
        0
      )

      return NextResponse.json({
        dailyData,
        topDoctorsByRevenue,
        revenueBySpecialization,
        summary: {
          total: Math.round(totalRevenue),
          avgPerDay: Math.round(totalRevenue / days),
          avgPerAppointment:
            appointments.length > 0
              ? Math.round(totalRevenue / appointments.length)
              : 0,
        },
      })
    }
  } catch (error) {
    console.error("Error fetching revenue analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}