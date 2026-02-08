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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get all appointments
    const allAppointments = await prisma.appointment.findMany()

    // Today's appointments
    const todayAppointments = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    // Upcoming appointments
    const upcomingAppointments = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: new Date(),
        },
        status: "SCHEDULED",
      },
    })

    // Completed appointments
    const completedAppointments = await prisma.appointment.count({
      where: {
        status: "COMPLETED",
      },
    })

    // Cancelled appointments
    const cancelledAppointments = await prisma.appointment.count({
      where: {
        status: "CANCELLED",
      },
    })

    // No show appointments
    const noShowAppointments = await prisma.appointment.count({
      where: {
        status: "NO_SHOW",
      },
    })

    // Calculate average duration
    const avgDuration =
      allAppointments.reduce((sum, apt) => sum + apt.duration, 0) /
        (allAppointments.length || 1)

    // Calculate completion rate
    const totalNonCancelled = allAppointments.filter(
      (a) => a.status !== "CANCELLED" && a.status !== "NO_SHOW"
    ).length
    const completionRate = totalNonCancelled
      ? Math.round((completedAppointments / totalNonCancelled) * 100)
      : 0

    return NextResponse.json({
      total: allAppointments.length,
      today: todayAppointments,
      upcoming: upcomingAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
      noShow: noShowAppointments,
      avgDuration: Math.round(avgDuration),
      completionRate,
    })
  } catch (error) {
    console.error("Error fetching appointment stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}