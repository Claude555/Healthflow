import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "month" // month, quarter, year

    // Calculate date range
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (period) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case "month":
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case "quarter":
        startDate = subMonths(startOfMonth(now), 3)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = startOfMonth(now)
    }

    // Fetch all data in parallel
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalPrescriptions,
      newPatientsThisPeriod,
      appointmentsThisPeriod,
      prescriptionsThisPeriod,
      completedAppointments,
      cancelledAppointments,
      activeAppointments,
      activePrescriptions,
      revenue,
    ] = await Promise.all([
      // Total counts
      prisma.patient.count(),
      prisma.doctor.count({ where: { status: "ACTIVE" } }),
      prisma.appointment.count(),
      prisma.prescription.count(),

      // Period-specific counts
      prisma.patient.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      prisma.prescription.count({
        where: {
          prescriptionDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      // Appointment statuses
      prisma.appointment.count({
        where: {
          status: "COMPLETED",
          appointmentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      prisma.appointment.count({
        where: {
          status: "CANCELLED",
          appointmentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),

      prisma.appointment.count({
        where: {
          status: {
            in: ["SCHEDULED", "CONFIRMED"],
          },
        },
      }),

      // Active prescriptions
      prisma.prescription.count({
        where: {
          prescriptionDate: {
            gte: new Date(),
          },
        },
      }),

      // Calculate revenue (completed appointments)
      prisma.appointment.findMany({
        where: {
          status: "COMPLETED",
          appointmentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          doctor: {
            select: {
              consultationFee: true,
            },
          },
        },
      }),
    ])

    // Calculate total revenue
    const totalRevenue = revenue.reduce(
      (sum, apt) => sum + (apt.doctor.consultationFee || 0),
      0
    )

    // Calculate growth percentages (compare to previous period)
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1)
    const previousPeriodEnd = new Date(endDate)
    previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1)

    const [
      previousPatients,
      previousAppointments,
      previousPrescriptions,
    ] = await Promise.all([
      prisma.patient.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd,
          },
        },
      }),
      prisma.prescription.count({
        where: {
          prescriptionDate: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd,
          },
        },
      }),
    ])

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    return NextResponse.json({
      overview: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalPrescriptions,
        activeAppointments,
        activePrescriptions,
        totalRevenue: Math.round(totalRevenue),
      },
      period: {
        newPatients: newPatientsThisPeriod,
        appointments: appointmentsThisPeriod,
        prescriptions: prescriptionsThisPeriod,
        completedAppointments,
        cancelledAppointments,
        revenue: Math.round(totalRevenue),
      },
      growth: {
        patients: calculateGrowth(newPatientsThisPeriod, previousPatients),
        appointments: calculateGrowth(appointmentsThisPeriod, previousAppointments),
        prescriptions: calculateGrowth(prescriptionsThisPeriod, previousPrescriptions),
      },
      metrics: {
        appointmentCompletionRate:
          appointmentsThisPeriod > 0
            ? Math.round((completedAppointments / appointmentsThisPeriod) * 100)
            : 0,
        cancellationRate:
          appointmentsThisPeriod > 0
            ? Math.round((cancelledAppointments / appointmentsThisPeriod) * 100)
            : 0,
        avgRevenuePerAppointment:
          completedAppointments > 0
            ? Math.round(totalRevenue / completedAppointments)
            : 0,
      },
    })
  } catch (error) {
    console.error("Error fetching overview analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}