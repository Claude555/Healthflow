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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { Users, TrendingUp } from "lucide-react"

interface PatientAnalytics {
  growthData: Array<{
    date: string
    new: number
    total: number
  }>
  genderDistribution: Array<{
    gender: string
    count: number
  }>
  ageDistribution: Array<{
    group: string
    count: number
  }>
  bloodTypeDistribution: Array<{
    type: string
    count: number
  }>
  topPatients: Array<{
    name: string
    appointmentCount: number
    prescriptionCount: number
  }>
  summary: {
    total: number
    newThisPeriod: number
    avgAppointmentsPerPatient: number
  }
}

const COLORS = ["#3b82f6", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6"]

export default function PatientChart() {
  const [data, setData] = useState<PatientAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [days, setDays] = useState("30")

  useEffect(() => {
    fetchData()
  }, [days])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/patients?days=${days}`)
      const result = await response.json()
      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error("Failed to fetch patient analytics")
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Patient Analytics
          </CardTitle>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-sm text-gray-500">Total Patients</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.summary.total}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">New This Period</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.summary.newThisPeriod}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg Appointments</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.summary.avgAppointmentsPerPatient}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="growth" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="age">Age Groups</TabsTrigger>
            <TabsTrigger value="blood">Blood Type</TabsTrigger>
            <TabsTrigger value="engagement">Top Patients</TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="space-y-4">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data.growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Total Patients"
                />
                <Area
                  type="monotone"
                  dataKey="new"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="New Patients"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.genderDistribution}
                    dataKey="count"
                    nameKey="gender"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {data.genderDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg mb-4">
                  Gender Distribution
                </h3>
                {data.genderDistribution.map((item, index) => (
                  <div
                    key={item.gender}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium capitalize">
                        {item.gender.toLowerCase()}
                      </span>
                    </div>
                    <span className="text-2xl font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="age" className="space-y-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="blood" className="space-y-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.bloodTypeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#ef4444" name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <div className="space-y-3">
              {data.topPatients.map((patient, index) => (
                <div
                  key={patient.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      <span className="font-bold text-blue-700">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{patient.name}</p>
                      <p className="text-sm text-gray-500">
                        {patient.appointmentCount} appointments •{" "}
                        {patient.prescriptionCount} prescriptions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {patient.appointmentCount}
                    </p>
                    <p className="text-xs text-gray-500">appointments</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}