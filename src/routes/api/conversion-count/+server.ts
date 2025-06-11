import { json } from '@sveltejs/kit';
import { browser } from '$app/environment';

// In a real app, this would be stored in a database
// For now, we'll use a simple file-based storage simulation
let globalCount = 3200; // Starting count

export async function GET() {
  return json({ count: globalCount });
}

export async function POST() {
  globalCount++;
  return json({ count: globalCount });
} 