/**
 * Script to seed daily photos for test users in local Supabase
 * This creates simple colored PNG images for each user's daily photos
 */

import { createClient } from '@supabase/supabase-js';
import { createCanvas } from 'canvas';

// Local Supabase configuration
// Use service role key to bypass RLS for seeding
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// User data with colors
const users = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Alice', color: '#FF6B6B' }, // Red
  { id: '00000000-0000-0000-0000-000000000002', name: 'Bob', color: '#4ECDC4' }, // Cyan
  { id: '00000000-0000-0000-0000-000000000003', name: 'Charlie', color: '#95E1D3' }, // Mint
  { id: '00000000-0000-0000-0000-000000000004', name: 'Diana', color: '#F38181' }, // Pink
  { id: '00000000-0000-0000-0000-000000000005', name: 'Evan', color: '#AA96DA' }, // Purple
  { id: '00000000-0000-0000-0000-000000000006', name: 'Fiona', color: '#FCBAD3' }, // Light pink
  { id: '00000000-0000-0000-0000-000000000007', name: 'Grace', color: '#FFFFD2' }, // Yellow
];

// Dates from the seed file
const aliceDates = ['2025-10-22', '2025-10-23', '2025-10-24', '2025-10-25', '2025-10-26', '2025-10-27', '2025-10-28'];
const bobDates = ['2025-10-22', '2025-10-23', '2025-10-25', '2025-10-26', '2025-10-27', '2025-10-28'];
const charlieDates = ['2025-10-22', '2025-10-23', '2025-10-24', '2025-10-25', '2025-10-26', '2025-10-27', '2025-10-28'];
const dianaDates = ['2025-10-26', '2025-10-27', '2025-10-28'];
const evanDates = ['2025-10-22', '2025-10-24', '2025-10-26', '2025-10-27', '2025-10-28'];
const fionaDates = ['2025-10-22', '2025-10-23', '2025-10-24', '2025-10-25', '2025-10-26', '2025-10-27', '2025-10-28'];
const graceDates = ['2025-10-22', '2025-10-23', '2025-10-24', '2025-10-25', '2025-10-26', '2025-10-27', '2025-10-28'];

const userDates = [aliceDates, bobDates, charlieDates, dianaDates, evanDates, fionaDates, graceDates];

/**
 * Creates a simple colored PNG image
 */
function createPNG(color: string): Buffer {
  const canvas = createCanvas(400, 400);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 400, 400);

  return canvas.toBuffer('image/png');
}

/**
 * Upload a photo to Supabase storage
 */
async function uploadPhoto(userId: string, date: string, imageBuffer: Buffer): Promise<void> {
  const fileName = `${userId}/${date}.png`;

  const { error } = await supabase.storage
    .from('daily-photos')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    console.error(`Error uploading ${fileName}:`, error);
  } else {
    console.log(`✓ Uploaded ${fileName}`);
  }
}

/**
 * Main function to seed all photos
 */
async function seedPhotos() {
  console.log('Starting photo seeding...\n');

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const dates = userDates[i];

    console.log(`Seeding photos for ${user.name}...`);

    const png = createPNG(user.color);

    for (const date of dates) {
      await uploadPhoto(user.id, date, png);
    }

    console.log('');
  }

  console.log('Photo seeding complete!');
}

seedPhotos().catch(console.error);
