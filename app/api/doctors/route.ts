import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET all doctors
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const specialization = searchParams.get("specialization")
    const department = searchParams.get("department")
    const status = searchParams.get("status") as any
    const isAvailable = searchParams.get("isAvailable")

    const doctors = await prisma.doctor.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                  { phone: { contains: search, mode: "insensitive" } },
                  { specialization: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          specialization ? { specialization } : {},
          department ? { department } : {},
          status ? { status } : {},
          isAvailable !== null ? { isAvailable: isAvailable === "true" } : {},
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            appointments: true,
            prescriptions: true,
            assignedPatients: true,
            reviews: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    })

    // Calculate average rating for each doctor
    const doctorsWithRatings = doctors.map((doctor) => {
      const totalRating = doctor.reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = doctor.reviews.length > 0 
        ? (totalRating / doctor.reviews.length).toFixed(1)
        : null

      const { reviews, ...doctorData } = doctor
      return {
        ...doctorData,
        averageRating,
      }
    })

    return NextResponse.json(doctorsWithRatings)
  } catch (error) {
    console.error("Error fetching doctors:", error)
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    )
  }
}

// POST create new doctor
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      email,
      phone,
      specialization,
      licenseNumber,
      qualification,
      experience,
      consultationFee,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      department,
      languages,
      bio,
      role,
      status,
    } = body

    // Validation
    if (!name || !email || !phone || !specialization || !licenseNumber || !qualification) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingDoctor = await prisma.doctor.findFirst({
      where: {
        OR: [
          { email },
          { licenseNumber },
        ],
      },
    })

    if (existingDoctor) {
      return NextResponse.json(
        { error: "Doctor with this email or license number already exists" },
        { status: 400 }
      )
    }

    const doctor = await prisma.doctor.create({
      data: {
        name,
        email,
        phone,
        specialization,
        licenseNumber,
        qualification,
        experience: parseInt(experience) || 0,
        consultationFee: parseFloat(consultationFee) || 0,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        address,
        city,
        state,
        zipCode,
        department,
        languages,
        bio,
        role: role || "DOCTOR",
        status: status || "ACTIVE",
      },
    })

    // 🆕 CREATE DEFAULT SCHEDULE FOR NEW DOCTOR
    const defaultSchedule: Array<{ dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'; startTime: string; endTime: string; isAvailable: boolean }> = [
      { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '13:00', isAvailable: true },
      { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '17:00', isAvailable: false },
    ]

    await prisma.doctorSchedule.createMany({
      data: defaultSchedule.map(schedule => ({
        doctorId: doctor.id,
        ...schedule,
      }))
    })

    return NextResponse.json(doctor, { status: 201 })
  } catch (error) {
    console.error("Error creating doctor:", error)
    return NextResponse.json(
      { error: "Failed to create doctor" },
      { status: 500 }
    )
  }
}