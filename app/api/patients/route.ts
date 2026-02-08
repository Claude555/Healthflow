import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET all patients
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const gender = searchParams.get("gender") as any
    const bloodType = searchParams.get("bloodType") as any

    const patients = await prisma.patient.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                  { phone: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          gender ? { gender } : {},
          bloodType ? { bloodType } : {},
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
          },
        },
      },
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    )
  }
}

// POST create new patient
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      bloodType,
      address,
      city,
      state,
      zipCode,
      allergies,
      conditions,
    } = body

    // Validation
    if (!firstName || !lastName || !phone || !dateOfBirth || !gender) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if patient with same email already exists
    if (email) {
      const existingPatient = await prisma.patient.findFirst({
        where: { email },
      })

      if (existingPatient) {
        return NextResponse.json(
          { error: "Patient with this email already exists" },
          { status: 400 }
        )
      }
    }

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        bloodType,
        address,
        city,
        state,
        zipCode,
        allergies,
        conditions,
      },
    })

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error("Error creating patient:", error)
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    )
  }
}