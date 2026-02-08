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

    const startDate = startOfDay(subDays(new Date(), days))

    // Get all patients with their appointments
    const [patients, newPatients] = await Promise.all([
      prisma.patient.findMany({
        include: {
          appointments: true,
          prescriptions: true,
        },
      }),
      prisma.patient.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
    ])

    // Patient growth over time
    const patientsByDate: { [key: string]: number } = {}
    newPatients.forEach((patient) => {
      const dateKey = format(new Date(patient.createdAt), "yyyy-MM-dd")
      patientsByDate[dateKey] = (patientsByDate[dateKey] || 0) + 1
    })

    const growthData = []
    let cumulative = patients.length - newPatients.length
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateKey = format(date, "yyyy-MM-dd")
      const displayDate = format(date, "MMM dd")
      const newCount = patientsByDate[dateKey] || 0
      cumulative += newCount

      growthData.push({
        date: displayDate,
        new: newCount,
        total: cumulative,
      })
    }

    // Gender distribution
    const genderDistribution = patients.reduce((acc, patient) => {
      acc[patient.gender] = (acc[patient.gender] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    // Age distribution
    const ageGroups = {
      "0-17": 0,
      "18-30": 0,
      "31-45": 0,
      "46-60": 0,
      "61+": 0,
    }

    patients.forEach((patient) => {
      const age =
        new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
      if (age < 18) ageGroups["0-17"]++
      else if (age <= 30) ageGroups["18-30"]++
      else if (age <= 45) ageGroups["31-45"]++
      else if (age <= 60) ageGroups["46-60"]++
      else ageGroups["61+"]++
    })

    // Blood type distribution
    const bloodTypeDistribution = patients.reduce((acc, patient) => {
      if (patient.bloodType) {
        acc[patient.bloodType] = (acc[patient.bloodType] || 0) + 1
      }
      return acc
    }, {} as { [key: string]: number })

    // Patient engagement (appointments per patient)
    const appointmentsPerPatient = patients.map((patient) => ({
      patientId: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      appointmentCount: patient.appointments.length,
      prescriptionCount: patient.prescriptions.length,
    }))

    const topPatients = appointmentsPerPatient
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 10)

    // Average metrics
    const totalAppointments = appointmentsPerPatient.reduce(
      (sum, p) => sum + p.appointmentCount,
      0
    )
    const avgAppointmentsPerPatient =
      patients.length > 0 ? totalAppointments / patients.length : 0

    return NextResponse.json({
      growthData,
      genderDistribution: Object.entries(genderDistribution).map(
        ([gender, count]) => ({
          gender,
          count,
        })
      ),
      ageDistribution: Object.entries(ageGroups).map(([group, count]) => ({
        group,
        count,
      })),
      bloodTypeDistribution: Object.entries(bloodTypeDistribution).map(
        ([type, count]) => ({
          type: type.replace("_", " "),
          count,
        })
      ),
      topPatients,
      summary: {
        total: patients.length,
        newThisPeriod: newPatients.length,
        avgAppointmentsPerPatient: Math.round(avgAppointmentsPerPatient * 10) / 10,
      },
    })
  } catch (error) {
    console.error("Error fetching patient analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}