
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Transaction } from "@/lib/types"

interface TransactionsBarChartProps {
  transactions: Transaction[];
}

export default function TransactionsBarChart({ transactions }: TransactionsBarChartProps) {

  const processDataForChart = (txs: Transaction[]) => {
    const monthlyData: { [key: string]: { ingresos: number; egresos: number } } = {};

    txs.forEach(tx => {
      // Usar solo transacciones completadas (Pagado o Resuelto) para el gráfico
      if (tx.status !== 'Pagado' && tx.status !== 'Resuelto') {
        return;
      }

      const date = new Date(tx.date);
      const month = date.toLocaleString('default', { month: 'short' });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { ingresos: 0, egresos: 0 };
      }

      // Simplificación: consideramos 'Compra' y 'Servicio' como egresos para el cliente
      // y como ingresos para el proveedor.
      // Esta lógica debería ser más robusta en una app real.
      if (tx.type === 'Compra' || tx.type === 'Servicio') {
        monthlyData[month].egresos += tx.amount;
      } else {
        // Aquí iría la lógica para ingresos (p.e. recargas)
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
      color: "hsl(var(--chart-1))",
    },
    egresos: {
      label: "Egresos",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <div className="w-full h-[300px]">
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={chartData}>
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
                    tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                    cursor={false} 
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
                <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={4} />
                <Bar dataKey="egresos" fill="var(--color-egresos)" radius={4} />
            </BarChart>
        </ChartContainer>
    </div>
  )
}
