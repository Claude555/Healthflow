import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET all prescriptions
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get("patientId")
    const doctorId = searchParams.get("doctorId")
    const status = searchParams.get("status") as any
    const search = searchParams.get("search")

    const prescriptions = await prisma.prescription.findMany({
      where: {
        AND: [
          patientId ? { patientId } : {},
          doctorId ? { doctorId } : {},
          status ? { status } : {},
          search
            ? {
                OR: [
                  { diagnosis: { contains: search, mode: "insensitive" } },
                  { symptoms: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            allergies: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            email: true,
            phone: true,
          },
        },
        medications: {
          orderBy: {
            createdAt: "asc",
          },
        },
        refills: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        prescriptionDate: "desc",
      },
    })

    return NextResponse.json(prescriptions)
  } catch (error) {
    console.error("Error fetching prescriptions:", error)
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    )
  }
}

// POST create new prescription
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      patientId,
      doctorId,
      appointmentId,
      diagnosis,
      symptoms,
      medications,
      instructions,
      validUntil,
      aiSuggested,
      aiAnalysis,
    } = body

    // Validation
    if (!patientId || !doctorId || !diagnosis || !medications || medications.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check for drug interactions (simplified - in production use a proper API)
    const medicationNames = medications.map((m: any) => m.medicineName.toLowerCase())
    const interactions = checkDrugInteractions(medicationNames)

    // Create prescription with medications
    const prescription = await prisma.prescription.create({
      data: {
        patientId,
        doctorId,
        appointmentId,
        diagnosis,
        symptoms,
        instructions,
        validUntil: validUntil ? new Date(validUntil) : null,
        aiSuggested: aiSuggested || false,
        aiAnalysis: aiAnalysis || (interactions.length > 0 ? `Warning: Potential drug interactions detected: ${interactions.join(", ")}` : null),
        status: "ACTIVE",
        medications: {
          create: medications.map((med: any) => ({
            medicineName: med.medicineName,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.instructions,
          })),
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
          },
        },
        medications: true,
      },
    })

    return NextResponse.json(prescription, { status: 201 })
  } catch (error) {
    console.error("Error creating prescription:", error)
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 }
    )
  }
}

// Helper function to check drug interactions (simplified)
function checkDrugInteractions(medications: string[]): string[] {
  const interactions: string[] = []
  
  // Common drug interactions (simplified - use a proper API in production)
  const knownInteractions: { [key: string]: string[] } = {
    "warfarin": ["aspirin", "ibuprofen", "naproxen"],
    "aspirin": ["warfarin", "ibuprofen"],
    "metformin": ["alcohol"],
    "lisinopril": ["potassium"],
  }

  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const med1 = medications[i]
      const med2 = medications[j]
      
      if (knownInteractions[med1]?.includes(med2)) {
        interactions.push(`${med1} + ${med2}`)
      }
      if (knownInteractions[med2]?.includes(med1)) {
        interactions.push(`${med2} + ${med1}`)
      }
    }
  }

  return Array.from(new Set(interactions)) // Remove duplicates
}