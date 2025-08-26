'use server';

/**
 * @fileOverview Server actions for handling video generation and processing.
 * This file contains server-only logic, like file system access.
 */
import { generateVideoUrl } from '@/ai/flows/video-generation-flow';
import * as fs from 'fs/promises';
import { Readable } from 'stream';

// In a real App Hosting environment, you'd use a writable directory like /tmp.
const VIDEO_STORAGE_PATH = './public/videos';

async function ensureDirectoryExists(path: string) {
    try {
        await fs.access(path);
    } catch (error) {
        await fs.mkdir(path, { recursive: true });
    }
}

async function downloadVideo(videoUrl: string, fileName: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in the environment.");
    }
  
    const fullUrl = `${videoUrl}&key=${apiKey}`;
    const response = await fetch(fullUrl);

    if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch video. Status: ${response.status}`);
    }

    await ensureDirectoryExists(VIDEO_STORAGE_PATH);
    const filePath = `${VIDEO_STORAGE_PATH}/${fileName}`;
    
    // @ts-ignore - response.body is a ReadableStream which is compatible
    const webStream = response.body;
    const nodeStream = Readable.fromWeb(webStream as any);
    const fileStream = (await fs.open(filePath, 'w')).createWriteStream();
    
    await new Promise((resolve, reject) => {
        nodeStream.pipe(fileStream);
        nodeStream.on('error', reject);
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
    });

    return `/videos/${fileName}`; // Return a public URL path
}


/**
 * A server action that generates a video and saves it to the public directory.
 * @param prompt The text prompt to generate the video from.
 * @returns The public URL path to the saved video.
 */
export async function generateAndSaveVideo(prompt: string): Promise<{ videoPath?: string; error?: string }> {
    try {
        const videoUrl = await generateVideoUrl(prompt);
        const fileName = `video-${Date.now()}.mp4`;
        const publicPath = await downloadVideo(videoUrl, fileName);
        return { videoPath: publicPath };
    } catch (error: any) {
        console.error("[VIDEO_ACTION_ERROR]", error);
        return { error: error.message || "Failed to generate and save video." };
    }
}
