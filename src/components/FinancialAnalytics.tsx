"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Building, AlertCircle, Shield, TrendingUp, PieChart as PieChartIcon, BarChart3 } from "lucide-react";

interface Asset {
  id: number;
  name: string;
  type: string;
  value: number;
  updatedAt: string;
}

interface Liability {
  id: number;
  name: string;
  type: string;
  amount: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate: string;
  updatedAt: string;
}

interface Investment {
  id: number;
  name: string;
  type: string;
  shares: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  updatedAt: string;
}

interface EPFBalance {
  totalBalance: number | null;
  employeeContribution: number | null;
  employerContribution: number | null;
  dividendRate: number | null;
}

interface FinancialAnalyticsProps {
  netWorth: number | null;
  monthlyIncome: number | null;
  creditScore: number | null;
  assets: Asset[];
  liabilities: Liability[];
  investments: Investment[];
  epfBalance: EPFBalance;
}

export function FinancialAnalytics({ 
  netWorth, 
  monthlyIncome, 
  creditScore, 
  assets, 
  liabilities, 
  investments, 
  epfBalance 
}: FinancialAnalyticsProps) {
  
  const hasAnyData = netWorth !== null || monthlyIncome !== null || creditScore !== null || 
                     assets.length > 0 || liabilities.length > 0 || investments.length > 0 || 
                     epfBalance.totalBalance !== null;

  if (!hasAnyData) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <BarChart3 className="h-10 w-10 text-gray-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-medium text-foreground">No Analytics Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Add your financial information first to see visual analytics and insights about your financial health.
          </p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0);
  const totalInvestments = investments.reduce((sum, investment) => sum + investment.totalValue, 0);

  // Assets by Type Chart Data
  const assetsByType = assets.reduce((acc, asset) => {
    const existingType = acc.find(item => item.type === asset.type);
    if (existingType) {
      existingType.value += asset.value;
    } else {
      acc.push({ type: asset.type, value: asset.value });
    }
    return acc;
  }, [] as Array<{ type: string; value: number }>);

  // Financial Overview Data
  const financialOverview = [
    { category: "Assets", amount: totalAssets, color: "#10b981" },
    { category: "Liabilities", amount: totalLiabilities, color: "#ef4444" },
    { category: "Investments", amount: totalInvestments, color: "#8b5cf6" },
    { category: "EPF Balance", amount: epfBalance.totalBalance || 0, color: "#3b82f6" },
  ].filter(item => item.amount > 0);

  // Investment Performance Data
  const investmentPerformance = investments.map(investment => ({
    name: investment.name.length > 15 ? investment.name.substring(0, 15) + "..." : investment.name,
    value: investment.totalValue,
    gainLoss: investment.gainLossPercentage,
    fill: investment.gainLoss >= 0 ? "#10b981" : "#ef4444"
  }));

  // Liabilities by Type
  const liabilitiesByType = liabilities.reduce((acc, liability) => {
    const existingType = acc.find(item => item.type === liability.type);
    if (existingType) {
      existingType.value += liability.amount;
    } else {
      acc.push({ type: liability.type, value: liability.amount });
    }
    return acc;
  }, [] as Array<{ type: string; value: number }>);

  // Chart configurations
  const chartConfig: ChartConfig = {
    assets: {
      label: "Assets",
      color: "#10b981",
    },
    liabilities: {
      label: "Liabilities", 
      color: "#ef4444",
    },
    investments: {
      label: "Investments",
      color: "#8b5cf6",
    },
    epf: {
      label: "EPF Balance",
      color: "#3b82f6",
    },
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Financial Overview Chart */}
      {financialOverview.length > 0 && (
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg font-semibold text-foreground">Financial Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialOverview} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="category" 
                    className="fill-muted-foreground text-xs"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="fill-muted-foreground text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => [`MYR ${Number(value).toLocaleString()}`, "Amount"]}
                      />
                    } 
                  />
                  <Bar dataKey="amount" fill="var(--color-assets)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Assets Distribution Chart */}
      {assets.length > 0 && (
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg font-semibold text-foreground">Assets Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => [`MYR ${Number(value).toLocaleString()}`, "Value"]}
                      />
                    } 
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Investment Performance Chart */}
      {investments.length > 0 && (
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg font-semibold text-foreground">Investment Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={investmentPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="fill-muted-foreground text-xs"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    className="fill-muted-foreground text-xs"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => [`${Number(value).toFixed(2)}%`, "Gain/Loss"]}
                      />
                    } 
                  />
                  <Bar dataKey="gainLoss" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Liabilities Breakdown Chart */}
      {liabilities.length > 0 && (
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg font-semibold text-foreground">Liabilities Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={liabilitiesByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {liabilitiesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => [`MYR ${Number(value).toLocaleString()}`, "Amount"]}
                      />
                    } 
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* EPF Contribution Breakdown */}
      {epfBalance.totalBalance !== null && epfBalance.employeeContribution && epfBalance.employerContribution && (
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg font-semibold text-foreground">EPF Contributions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Employee", value: epfBalance.employeeContribution, fill: "#10b981" },
                      { name: "Employer", value: epfBalance.employerContribution, fill: "#3b82f6" }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => [`MYR ${Number(value).toLocaleString()}`, "Contribution"]}
                      />
                    } 
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}