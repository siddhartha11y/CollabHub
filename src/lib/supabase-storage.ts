import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Upload file to Supabase Storage
 * Supports files up to 5GB
 */
export async function uploadToSupabaseStorage(
  file: File,
  bucket: string = 'files',
  folder: string = 'uploads'
): Promise<{ url: string; path: string }> {
  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop()
  const fileName = `${timestamp}-${randomString}.${fileExtension}`
  const filePath = `${folder}/${fileName}`

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return {
    url: urlData.publicUrl,
    path: filePath
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFromSupabaseStorage(
  filePath: string,
  bucket: string = 'files'
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

/**
 * Get file info from Supabase Storage
 */
export async function getFileInfo(
  filePath: string,
  bucket: string = 'files'
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(filePath.split('/').slice(0, -1).join('/'), {
      search: filePath.split('/').pop()
    })

  if (error) {
    throw new Error(`Get file info failed: ${error.message}`)
  }

  return data?.[0]
}