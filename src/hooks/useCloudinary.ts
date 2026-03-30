// src/hooks/useCloudinary.ts
import { useState } from 'react';

interface UploadResult {
  url: string;
  publicId: string;
}

// الـ settings دي بتجيها من Admin Panel في Firebase
// settings/cloudinary في Firestore
export function useCloudinary() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function uploadFile(
    file: File,
    folder: string,
    preset?: string
  ): Promise<UploadResult> {
    setUploading(true);
    setProgress(0);

    // جلب Cloudinary settings من Firestore
    const { getDoc, doc } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');
    const snap = await getDoc(doc(db, 'settings', 'cloudinary'));
    if (!snap.exists()) throw new Error('لم يتم ضبط إعدادات Cloudinary في الأدمن');

    const { cloudName, uploadPreset } = snap.data();
    const finalPreset = preset || uploadPreset;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', finalPreset);
    formData.append('folder', folder);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'خطأ في رفع الصورة');
      }

      const data = await res.json();
      setProgress(100);
      return { url: data.secure_url, publicId: data.public_id };
    } finally {
      setUploading(false);
    }
  }

  async function uploadMultiple(
    files: { file: File; label: string }[],
    baseFolder: string
  ): Promise<Record<string, UploadResult>> {
    const results: Record<string, UploadResult> = {};
    for (let i = 0; i < files.length; i++) {
      const { file, label } = files[i];
      setProgress(Math.round((i / files.length) * 100));
      results[label] = await uploadFile(file, baseFolder);
    }
    return results;
  }

  return { uploadFile, uploadMultiple, uploading, progress };
}
