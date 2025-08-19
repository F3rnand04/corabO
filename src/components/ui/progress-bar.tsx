
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
    current: number;
    total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
    const progress = (current / total) * 100;
    return (
        <div className="w-full bg-muted rounded-full h-2.5">
            <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
}
