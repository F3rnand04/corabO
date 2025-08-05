
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
    let totalIngresosPendientes = 0;
    let totalEgresosPendientes = 0;

    txs.forEach(tx => {
      const isCompleted = ['Pagado', 'Resuelto', 'Recarga'].includes(tx.status);
      const isPending = ['Acuerdo Aceptado - Pendiente de Ejecución', 'Finalizado - Pendiente de Pago'].includes(tx.status);

      if (tx.type === 'Compra' || tx.type === 'Servicio') {
        if (isCompleted) totalEgresos += tx.amount;
        if (isPending) totalEgresosPendientes += tx.amount;
      } else { // Sistema
        if (isCompleted) totalIngresos += tx.amount;
        if (isPending) totalIngresosPendientes += tx.amount;
      }
    });

    return [
      { name: 'Ingresos', value: totalIngresos, fill: 'hsl(var(--chart-2))' },
      { name: 'Egresos', value: totalEgresos, fill: 'hsl(var(--chart-1))' },
      { name: 'Pendiente por Cobrar', value: totalIngresosPendientes, fill: 'hsl(var(--chart-2), 0.5)' },
      { name: 'Pendiente por Pagar', value: totalEgresosPendientes, fill: 'hsl(var(--chart-1), 0.5)' },
    ].filter(item => item.value > 0);
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
      label: "Pend. Cobrar",
      color: "hsl(var(--chart-2))"
    },
    egresosPendientes: {
      label: "Pend. Pagar",
      color: "hsl(var(--chart-1))"
    }
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
