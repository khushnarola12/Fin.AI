"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from "lucide-react"

interface ChartData {
  monthly: Record<string, number>
  yearly: Record<string, number>
  credit: number
  debit: number
}

export default function Charts({ data }: { data: ChartData }) {
  if (!data || typeof data !== "object") {
    return (
      <div className="p-6 text-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No data available to display charts.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { monthly = {}, yearly = {}, credit = 0, debit = 0 } = data

  if (!monthly || typeof monthly !== "object" || Object.keys(monthly).length === 0) {
    return (
      <div className="p-6 text-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No monthly data available to display charts.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please ensure your CSV file contains valid transaction data.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const monthlyData = Object.entries(monthly)
    .map(([key, val]) => {
      const [year, month] = key.split("-")
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return {
        month: `${monthNames[Number.parseInt(month) - 1]} ${year}`,
        expenses: val,
        fullDate: new Date(Number.parseInt(year), Number.parseInt(month) - 1),
      }
    })
    .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
    .map(({ month, expenses }) => ({ month, expenses }))

  const yearlyData = Object.entries(yearly)
    .map(([key, val]) => ({
      year: key,
      expenses: val,
    }))
    .sort((a, b) => Number.parseInt(a.year) - Number.parseInt(b.year))

  const totalExpenses = debit
  const netBalance = credit - debit
  const avgMonthlyExpense = monthlyData.length > 0 ? totalExpenses / monthlyData.length : 0

  const chartConfig = {
    expenses: {
      label: "Expenses",
      color: "hsl(var(--chart-1))",
    },
    income: {
      label: "Income",
      color: "hsl(var(--chart-2))",
    },
  }

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Financial Analytics Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">Comprehensive overview of your financial data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Credit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatINR(credit)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Debit</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatINR(debit)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatINR(netBalance)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Monthly</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatINR(avgMonthlyExpense)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            Monthly Expenses Trend
          </CardTitle>
          <CardDescription>Track your spending patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-sm"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-sm" tick={{ fontSize: 12 }} tickFormatter={(value) => formatINR(value)} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => [formatINR(Number(value)), "Expenses"]} />}
                />
                <defs>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={3}
                  fill="url(#expenseGradient)"
                  dot={{
                    fill: "hsl(var(--chart-1))",
                    strokeWidth: 2,
                    r: 5,
                    stroke: "#fff",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
                  }}
                  activeDot={{
                    r: 8,
                    stroke: "hsl(var(--chart-1))",
                    strokeWidth: 3,
                    fill: "#fff",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))",
                  }}
                  connectNulls={true}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <BarChart className="h-6 w-6 text-purple-500" />
            Yearly Expenses Overview
          </CardTitle>
          <CardDescription>Annual spending comparison across years</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" className="text-sm" tick={{ fontSize: 12 }} />
                <YAxis className="text-sm" tick={{ fontSize: 12 }} tickFormatter={(value) => formatINR(value)} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => [formatINR(Number(value)), "Expenses"]} />}
                />
                <Bar
                  dataKey="expenses"
                  fill="var(--color-expenses)"
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
