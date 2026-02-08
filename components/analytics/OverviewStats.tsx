"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Stethoscope,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
} from "lucide-react"

interface OverviewData {
  overview: {
    totalPatients: number
    totalDoctors: number
    totalAppointments: number
    totalPrescriptions: number
    activeAppointments: number
    activePrescriptions: number
    totalRevenue: number
  }
  period: {
    newPatients: number
    appointments: number
    prescriptions: number
    completedAppointments: number
    cancelledAppointments: number
    revenue: number
  }
  growth: {
    patients: number
    appointments: number
    prescriptions: number
  }
  metrics: {
    appointmentCompletionRate: number
    cancellationRate: number
    avgRevenuePerAppointment: number
  }
}

export default function OverviewStats() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState("month")

  useEffect(() => {
    fetchOverviewData()
  }, [period])

  const fetchOverviewData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/overview?period=${period}`)
      const result = await response.json()
      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error("Failed to fetch overview data")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-12">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const GrowthBadge = ({ value }: { value: number }) => {
    const isPositive = value >= 0
    return (
      <Badge
        variant="outline"
        className={`gap-1 ${
          isPositive
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {Math.abs(value)}%
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Patients
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.overview.totalPatients.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm text-gray-600">
                +{data.period.newPatients} this period
              </p>
              <GrowthBadge value={data.growth.patients} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Doctors
            </CardTitle>
            <Stethoscope className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.overview.totalDoctors}
            </div>
            <p className="text-sm text-gray-600 mt-2">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Appointments
            </CardTitle>
            <Calendar className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {data.overview.totalAppointments.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm text-gray-600">
                {data.period.appointments} this period
              </p>
              <GrowthBadge value={data.growth.appointments} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              ${data.overview.totalRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              ${data.period.revenue.toLocaleString()} this period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Appointments
            </CardTitle>
            <Activity className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {data.overview.activeAppointments}
            </div>
            <p className="text-xs text-gray-500 mt-1">Scheduled/Confirmed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {data.metrics.appointmentCompletionRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data.period.completedAppointments} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Revenue/Appt
            </CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ${data.metrics.avgRevenuePerAppointment}
            </div>
            <p className="text-xs text-gray-500 mt-1">Per appointment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Prescriptions
            </CardTitle>
            <FileText className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {data.overview.activePrescriptions}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data.period.prescriptions} issued this period
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}