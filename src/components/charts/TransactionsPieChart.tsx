
"use client"

import * as React from "react"
import { Pie, PieChart, Tooltip } from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { Transaction } from "@/lib/types"

interface TransactionsPieChartProps {
  transactions: Transaction[];
}

export default function TransactionsPieChart({ transactions }: TransactionsPieChartProps) {

  const processDataForChart = (txs: Transaction[]) => {
    let totalIngresos = 0;
    let totalEgresos = 0;

    txs.forEach(tx => {
      if (tx.status !== 'Pagado' && tx.status !== 'Resuelto') {
        return;
      }
      if (tx.type === 'Compra' || tx.type === 'Servicio') {
        totalEgresos += tx.amount;
      } else {
        totalIngresos += tx.amount;
      }
    });

    return [
      { name: 'Ingresos', value: totalIngresos, fill: 'var(--color-ingresos)' },
      { name: 'Egresos', value: totalEgresos, fill: 'var(--color-egresos)' },
    ].filter(item => item.value > 0);
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
    <div className="w-full h-[250px]">
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <PieChart>
                <Tooltip 
                    cursor={false} 
                    content={<ChartTooltipContent 
                        hideLabel 
                        formatter={(value, name) => (
                             <div className="flex items-center gap-2">
                                <span className="capitalize font-medium text-muted-foreground">{name}</span>
                                <span className="font-bold">${(value as number).toFixed(2)}</span>
                            </div>
                        )}
                    />} 
                />
                 <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                />
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
        </ChartContainer>
    </div>
  )
}

    