
"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"

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
    const monthlyData: { [key: string]: { ingresos: number; egresos: number; ingresosPendientes: number; egresosPendientes: number; } } = {};

    txs.forEach(tx => {
      const date = new Date(tx.date);
      // For pending transactions, we consider their future date. For past, their historical date.
      const monthDate = tx.status === 'Pagado' || tx.status === 'Resuelto' ? date : new Date();
      const month = monthDate.toLocaleString('default', { month: 'short' });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { ingresos: 0, egresos: 0, ingresosPendientes: 0, egresosPendientes: 0 };
      }

      const isCompleted = tx.status === 'Pagado' || tx.status === 'Resuelto' || tx.status === 'Recarga';
      const isPending = ['Acuerdo Aceptado - Pendiente de Ejecución', 'Finalizado - Pendiente de Pago'].includes(tx.status);

      if (tx.type === 'Compra' || tx.type === 'Servicio') {
        if (isCompleted) monthlyData[month].egresos += tx.amount;
        if (isPending) monthlyData[month].egresosPendientes += tx.amount;
      } else if (tx.type === 'Sistema') {
         if (isCompleted) monthlyData[month].ingresos += tx.amount;
         if (isPending) monthlyData[month].ingresosPendientes += tx.amount;
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
            monthlyData[month] = { ingresos: 0, egresos: 0, ingresosPendientes: 0, egresosPendientes: 0 };
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
     ingresosPendientes: {
      label: "Ing. Pendientes",
      color: "hsl(var(--chart-2))",
    },
    egresosPendientes: {
      label: "Egr. Pendientes",
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <div className="w-full aspect-video">
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <LineChart accessibilityLayer data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    stroke=""
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    stroke=""
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
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="var(--color-ingresos)" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="egresos" stroke="var(--color-egresos)" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="ingresosPendientes" name="Ing. Pendientes" stroke="var(--color-ingresos)" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                <Line type="monotone" dataKey="egresosPendientes" name="Egr. Pendientes" stroke="var(--color-egresos)" strokeWidth={2} strokeDasharray="3 3" dot={false} />
            </LineChart>
        </ChartContainer>
    </div>
  )
}
