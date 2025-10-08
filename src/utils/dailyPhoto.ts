import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

export interface DailyPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  uploaded_at: string;
  date: string;
}

/**
 * Request camera and media library permissions
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
  const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  return cameraStatus === 'granted' && mediaStatus === 'granted';
}

/**
 * Pick an image from the device gallery or camera
 */
export async function pickDailyPhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0];
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw new Error('Failed to pick image');
  }
}

/**
 * Upload daily photo to Supabase Storage and create database record
 */
export async function uploadDailyPhoto(
  userId: string,
  imageUri: string
): Promise<DailyPhoto> {
  try {
    // Get current date for filename and record
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `${userId}/${today}.${fileExt}`;

    // Convert image to ArrayBuffer for React Native
    const response = await fetch(imageUri);
    const arrayBuffer = await response.arrayBuffer();

    // Check if photo already exists for today
    const { data: existingPhoto } = await supabase
      .from('daily_photos')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    // If exists, delete old photo from storage
    if (existingPhoto) {
      const oldUrl = existingPhoto.photo_url;
      // Extract path from URL (everything after /daily-photos/)
      const pathMatch = oldUrl.match(/daily-photos\/(.+)/);
      if (pathMatch && pathMatch[1]) {
        const oldPath = pathMatch[1];
        await supabase.storage
          .from('daily-photos')
          .remove([oldPath]);
      }
    }

    // Upload new photo to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('daily-photos')
      .upload(fileName, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('daily-photos')
      .getPublicUrl(fileName);

    // Insert or update database record
    const { data: photoRecord, error: dbError } = await supabase
      .from('daily_photos')
      .upsert(
        {
          user_id: userId,
          photo_url: publicUrl,
          date: today,
          uploaded_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,date',
        }
      )
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    return photoRecord;
  } catch (error) {
    console.error('Error uploading daily photo:', error);
    throw new Error('Failed to upload photo');
  }
}

/**
 * Get today's photo for the current user
 */
export async function getTodayPhoto(userId: string): Promise<DailyPhoto | null> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_photos')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching today\'s photo:', error);
    return null;
  }
}

/**
 * Delete a daily photo
 */
export async function deleteDailyPhoto(photoId: string, photoUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const fileName = photoUrl.split('/daily-photos/')[1];

    if (fileName) {
      // Delete from storage
      await supabase.storage
        .from('daily-photos')
        .remove([fileName]);
    }

    // Delete database record
    const { error } = await supabase
      .from('daily_photos')
      .delete()
      .eq('id', photoId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting daily photo:', error);
    throw new Error('Failed to delete photo');
  }
}
