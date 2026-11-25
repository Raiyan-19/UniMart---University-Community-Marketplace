import { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function getSupabaseStorageClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function uploadImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized. Please log in.' });
      return;
    }

    const { data, mimeType } = req.body;

    if (!data) {
      res.status(400).json({ success: false, error: 'No image data provided.' });
      return;
    }

    let rawBase64 = data;
    let detectedMime = mimeType;

    const dataUrlMatch = data.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUrlMatch) {
      detectedMime = dataUrlMatch[1].toLowerCase();
      rawBase64 = dataUrlMatch[2];
    }

    if (!detectedMime || !ALLOWED_MIME_TYPES[detectedMime]) {
      res.status(400).json({
        success: false,
        error: 'Unsupported image format. Allowed formats are JPG, JPEG, PNG, and WEBP.',
      });
      return;
    }

    const buffer = Buffer.from(rawBase64, 'base64');

    if (buffer.length > MAX_FILE_SIZE) {
      res.status(400).json({
        success: false,
        error: `File size exceeds the 5 MB limit. (Selected size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`,
      });
      return;
    }

    const extension = ALLOWED_MIME_TYPES[detectedMime];
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const safeFilename = `img_${Date.now()}_${uniqueId}${extension}`;

    // Prefer persistent Supabase Storage CDN when configured
    const supabase = getSupabaseStorageClient();
    const bucketName = process.env.SUPABASE_BUCKET || 'unimart-uploads';

    if (supabase) {
      const storagePath = `${req.user._id}/${safeFilename}`;
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, buffer, {
          contentType: detectedMime,
          upsert: false,
        });

      if (uploadError) {
        console.error('[Upload] Supabase Storage failed:', uploadError.message);
        res.status(502).json({
          success: false,
          error: `Cloud image upload failed: ${uploadError.message}`,
        });
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

      res.json({
        success: true,
        url: publicUrlData.publicUrl,
        filename: safeFilename,
        size: buffer.length,
        mimeType: detectedMime,
        storage: 'supabase',
      });
      return;
    }

    // Local filesystem fallback (dev only)
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      url: `/uploads/${safeFilename}`,
      filename: safeFilename,
      size: buffer.length,
      mimeType: detectedMime,
      storage: 'local',
    });
  } catch (err: any) {
    console.error('Upload Error:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to upload image.',
    });
  }
}
