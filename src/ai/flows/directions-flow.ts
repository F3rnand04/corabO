
'use server';
/**
 * @fileOverview A flow for calculating directions and estimated time of arrival (ETA).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GetEtaInputSchema = z.object({
    origin: z.object({ lat: z.number(), lon: z.number() }),
    destination: z.object({ lat: z.number(), lon: z.number() }),
});

const GetEtaOutputSchema = z.object({
    durationMinutes: z.number(),
});

export type GetEtaOutput = z.infer<typeof GetEtaOutputSchema>;

/**
 * Calculates the estimated time of arrival (ETA) between two points.
 * In a real-world scenario, this would call the Google Maps Directions API.
 * For this prototype, it simulates the calculation based on a simple distance/speed model.
 */
export const getEta = ai.defineFlow(
    {
        name: 'getEtaFlow',
        inputSchema: GetEtaInputSchema,
        outputSchema: GetEtaOutputSchema,
    },
    async ({ origin, destination }) => {
        // Basic Haversine distance calculation
        const R = 6371; // Earth radius in km
        const dLat = (destination.lat - origin.lat) * Math.PI / 180;
        const dLon = (destination.lon - origin.lon) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Simulate travel time: average speed of 25 km/h in a city
        const averageSpeedKmh = 25;
        const durationHours = distance / averageSpeedKmh;
        const durationMinutes = Math.round(durationHours * 60) + 5; // Add 5 mins for traffic/prep

        return { durationMinutes };
    }
);
