"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { DollarSign, TrendingUp } from "lucide-react"

interface RevenueAnalytics {
  dailyData?: Array<{
    date: string
    revenue: number
    appointments: number
  }>
  monthlyData?: Array<{
    month: string
    revenue: number
    appointments: number
  }>
  topDoctorsByRevenue?: Array<{
    name: string
    revenue: number
  }>
  revenueBySpecialization?: Array<{
    specialization: string
    revenue: number
  }>
  summary?: {
    total: number
    avgPerDay: number
    avgPerAppointment: number
  }
}

export default function RevenueChart() {
  const [data, setData] = useState<RevenueAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<"daily" | "monthly">("daily")

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/revenue?period=${period}`)
      const result = await response.json()
      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error("Failed to fetch revenue analytics")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const chartData = period === "daily" ? data.dailyData : data.monthlyData

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Revenue Analytics
          </CardTitle>
          <Select
            value={period}
            onValueChange={(value: "daily" | "monthly") => setPeriod(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily (30 days)</SelectItem>
              <SelectItem value="monthly">Monthly (12 months)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {data.summary && (
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.summary.total.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Avg Per {period === "daily" ? "Day" : "Month"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.summary.avgPerDay.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Per Appointment</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.summary.avgPerAppointment.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trend" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trend">Revenue Trend</TabsTrigger>
            <TabsTrigger value="doctors">Top Doctors</TabsTrigger>
            <TabsTrigger value="specialization">By Specialization</TabsTrigger>
          </TabsList>

          <TabsContent value="trend" className="space-y-4">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={period === "daily" ? "date" : "month"}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={period === "daily" ? "date" : "month"}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="appointments"
                  fill="#3b82f6"
                  name="Appointments"
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="doctors" className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.topDoctorsByRevenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {data.topDoctorsByRevenue?.map((doctor, index) => (
                <Card key={doctor.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                          <span className="font-bold text-green-700">
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">Dr. {doctor.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          ${doctor.revenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="specialization" className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.revenueBySpecialization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="specialization"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}