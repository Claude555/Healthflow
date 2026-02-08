"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts"
import { ArrowRight, TrendingUp, Users, Calendar, DollarSign } from "lucide-react"

export default function QuickAnalytics() {
  const router = useRouter()
  const [appointmentData, setAppointmentData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchQuickData()
  }, [])

  const fetchQuickData = async () => {
    try {
      // Fetch last 7 days for quick view
      const [appointments, revenue] = await Promise.all([
        fetch("/api/analytics/appointments?days=7").then((r) => r.json()),
        fetch("/api/analytics/revenue?period=daily").then((r) => r.json()),
      ])

      if (appointments.dailyData) {
        setAppointmentData(appointments.dailyData.slice(-7))
      }
      if (revenue.dailyData) {
        setRevenueData(revenue.dailyData.slice(-7))
      }
    } catch (error) {
      console.error("Failed to fetch quick analytics")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Quick Analytics
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/analytics")}
          className="gap-2"
        >
          View Full Analytics
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appointments Trend */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-3">
              Appointments (Last 7 Days)
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={appointmentData}>
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-3">
              Revenue (Last 7 Days)
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={revenueData}>
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}