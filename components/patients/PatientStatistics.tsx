"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, Activity, Calendar } from "lucide-react"

interface Patient {
  dateOfBirth: string
  gender: string
  createdAt: string
}

interface PatientStatisticsProps {
  patients: Patient[]
}

export default function PatientStatistics({ patients }: PatientStatisticsProps) {
  const calculateAverageAge = () => {
    if (patients.length === 0) return 0

    const totalAge = patients.reduce((sum, patient) => {
      const today = new Date()
      const birth = new Date(patient.dateOfBirth)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return sum + age
    }, 0)

    return Math.round(totalAge / patients.length)
  }

  const getNewPatientsThisMonth = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return patients.filter((patient) => {
      const createdDate = new Date(patient.createdAt)
      return (
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear
      )
    }).length
  }

  const getGenderDistribution = () => {
    const male = patients.filter((p) => p.gender === "MALE").length
    const female = patients.filter((p) => p.gender === "FEMALE").length
    const other = patients.filter((p) => p.gender === "OTHER").length

    return { male, female, other }
  }

  const avgAge = calculateAverageAge()
  const newThisMonth = getNewPatientsThisMonth()
  const distribution = getGenderDistribution()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Patients
          </CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{patients.length}</div>
          <p className="text-xs text-gray-500 mt-1">
            {distribution.male}M / {distribution.female}F / {distribution.other}O
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Average Age
          </CardTitle>
          <Activity className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgAge} years</div>
          <p className="text-xs text-gray-500 mt-1">Across all patients</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            New This Month
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{newThisMonth}</div>
          <p className="text-xs text-gray-500 mt-1">Registered patients</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Active Today
          </CardTitle>
          <Calendar className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-gray-500 mt-1">With appointments</p>
        </CardContent>
      </Card>
    </div>
  )
}