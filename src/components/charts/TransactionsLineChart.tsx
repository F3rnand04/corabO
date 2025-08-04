
"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Transaction } from "@/lib/types"

interface TransactionsLineChartProps {
  transactions: Transaction[];
}

export default function TransactionsLineChart({ transactions }: TransactionsLineChartProps) {

  const processDataForChart = (txs: Transaction[]) => {
    const monthlyData: { [key: string]: { ingresos: number; egresos: number } } = {};

    txs.forEach(tx => {
      // Usar solo transacciones completadas (Pagado o Resuelto o Recarga) para el gráfico
      if (!['Pagado', 'Resuelto', 'Recarga'].includes(tx.status)) {
        return;
      }

      const date = new Date(tx.date);
      const month = date.toLocaleString('default', { month: 'short' });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { ingresos: 0, egresos: 0 };
      }

      if (tx.type === 'Compra' || tx.type === 'Servicio') {
        monthlyData[month].egresos += tx.amount;
      } else if (tx.type === 'Sistema' && tx.status === 'Recarga') {
        monthlyData[month].ingresos += tx.amount;
      }
    });

    // Asegurarse de tener al menos datos para los últimos meses
    const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('default', { month: 'short' });
    }).reverse();

    lastSixMonths.forEach(month => {
        if (!monthlyData[month]) {
            monthlyData[month] = { ingresos: 0, egresos: 0 };
        }
    });

    return Object.entries(monthlyData).map(([name, values]) => ({ name, ...values })).slice(-6);
  };
  
  const chartData = processDataForChart(transactions);

  const chartConfig = {
    ingresos: {
      label: "Ingresos",
      color: "hsl(var(--chart-2))",
    },
    egresos: {
      label: "Egresos",
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <div className="w-full aspect-video">
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                    cursor={true} 
                    content={<ChartTooltipContent 
                        labelClassName="font-bold"
                        formatter={(value, name) => (
                            <div className="flex flex-col">
                                <span className="capitalize">{name}</span>
                                <span className="font-bold">${(value as number).toFixed(2)}</span>
                            </div>
                        )}
                    />} 
                />
                <Line type="monotone" dataKey="ingresos" stroke="var(--color-ingresos)" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="egresos" stroke="var(--color-egresos)" strokeWidth={3} dot={false} />
            </LineChart>
        </ChartContainer>
    </div>
  )
}

    
