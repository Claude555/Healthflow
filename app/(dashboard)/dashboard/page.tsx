"use client"

import { useState, useEffect } from "react"
import MainLayout from "@/components/layout/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AppointmentOverview from "@/components/dashboard/AppointmentOverview"
import QuickAnalytics from "@/components/dashboard/QuickAnalytics"
import { useRouter } from "next/navigation"
import {
  Users,
  Calendar,
  FileText,
  Stethoscope,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  ArrowRight,
  Activity,
  AlertCircle,
} from "lucide-react"

interface DashboardStats {
  patients: number
  doctors: number
  appointments: number
  prescriptions: number
  todayAppointments: number
  pendingAppointments: number
  revenue: number
  completionRate: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/analytics/overview?period=month")
      const data = await response.json()

      if (response.ok) {
        setStats({
          patients: data.overview.totalPatients,
          doctors: data.overview.totalDoctors,
          appointments: data.overview.totalAppointments,
          prescriptions: data.overview.totalPrescriptions,
          todayAppointments: data.period.appointments,
          pendingAppointments: data.overview.activeAppointments,
          revenue: data.overview.totalRevenue,
          completionRate: data.metrics.appointmentCompletionRate,
        })
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to HealthFlow
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your healthcare facility today
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-blue-500"
            onClick={() => router.push("/patients")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Patients
              </CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.patients.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                View all patients
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-green-500"
            onClick={() => router.push("/doctors")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Doctors
              </CardTitle>
              <Stethoscope className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.doctors}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                Manage doctors
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-purple-500"
            onClick={() => router.push("/appointments")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Appointments
              </CardTitle>
              <Calendar className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.appointments.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.todayAppointments} today
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-orange-500"
            onClick={() => router.push("/analytics")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ${stats?.revenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                View analytics
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Appointments
              </CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.pendingAppointments}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completion Rate
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.completionRate}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Prescriptions
              </CardTitle>
              <FileText className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.prescriptions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                System Status
              </CardTitle>
              <Activity className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule & Quick Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AppointmentOverview />
          <QuickAnalytics />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => router.push("/patients")}
              >
                <Users className="h-6 w-6 text-blue-600" />
                <span>New Patient</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => router.push("/appointments")}
              >
                <Calendar className="h-6 w-6 text-purple-600" />
                <span>Book Appointment</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => router.push("/prescriptions")}
              >
                <FileText className="h-6 w-6 text-green-600" />
                <span>New Prescription</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => router.push("/analytics")}
              >
                <TrendingUp className="h-6 w-6 text-orange-600" />
                <span>View Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Important Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">
                    {stats?.pendingAppointments} Pending Appointments
                  </p>
                  <p className="text-sm text-yellow-700">
                    Review and confirm upcoming appointments
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">System Backup</p>
                  <p className="text-sm text-blue-700">
                    Last backup completed successfully 2 hours ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}