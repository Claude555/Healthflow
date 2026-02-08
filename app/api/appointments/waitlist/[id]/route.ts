import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE waitlist entry
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    await prisma.appointmentWaitlist.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting waitlist entry:", error)
    return NextResponse.json(
      { error: "Failed to delete waitlist entry" },
      { status: 500 }
    )
  }
}

// PUT update waitlist entry
export async function PUT(
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
    const { status, isNotified } = body

    const waitlistEntry = await prisma.appointmentWaitlist.update({
      where: { id },
      data: {
        status,
        isNotified,
        notifiedAt: isNotified ? new Date() : undefined,
      },
    })

    return NextResponse.json(waitlistEntry)
  } catch (error) {
    console.error("Error updating waitlist entry:", error)
    return NextResponse.json(
      { error: "Failed to update waitlist entry" },
      { status: 500 }
    )
  }
}