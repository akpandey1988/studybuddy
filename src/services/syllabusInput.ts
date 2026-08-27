// Getting a syllabus off a phone: a photo of the sheet, a PDF, or typed text.
//
// The file goes to the backend inline, base64 in the callable payload, which
// caps how big it can be. Images are therefore captured at reduced quality and
// PDFs are size-checked before encoding — a clear "too big" beats a request
// that dies in transit.

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

export type Attachment = {
  kind: 'image' | 'pdf';
  /** Base64 without a data: prefix. */
  data: string;
  mediaType: string;
  name: string;
  /** Decoded size in bytes, for display and limits. */
  bytes: number;
};

export class SyllabusInputError extends Error {}

/**
 * Callable payloads are limited, and base64 inflates by about a third, so hold
 * the raw file well under that. A syllabus sheet photo lands around 300-800KB
 * at this quality, and school syllabus PDFs are typically under a megabyte.
 */
const MAX_BYTES = 6 * 1024 * 1024;
const IMAGE_QUALITY = 0.7;

const tooBig = (bytes: number) =>
  new SyllabusInputError(
    `That file is ${(bytes / 1048576).toFixed(1)} MB — the limit is ${MAX_BYTES / 1048576} MB. `
    + 'Try a photo of just the syllabus pages, or type the chapter names instead.',
  );

/** Rough decoded size of a base64 string, without allocating a buffer. */
function base64Bytes(b64: string): number {
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

function fromImageAsset(asset: ImagePicker.ImagePickerAsset): Attachment {
  if (!asset.base64) throw new SyllabusInputError("Couldn't read that image. Try again.");
  const bytes = base64Bytes(asset.base64);
  if (bytes > MAX_BYTES) throw tooBig(bytes);
  // Claude needs a real image media type; the picker reports the file name.
  const mediaType = asset.mimeType && asset.mimeType.startsWith('image/')
    ? asset.mimeType
    : 'image/jpeg';
  return {
    kind: 'image',
    data: asset.base64,
    mediaType,
    name: asset.fileName || 'syllabus photo',
    bytes,
  };
}

/** Photograph the syllabus sheet. */
export async function captureSyllabusPhoto(): Promise<Attachment | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new SyllabusInputError('Nexora needs camera access to read your syllabus sheet.');
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: IMAGE_QUALITY,
    base64: true,
    // Let them crop to just the syllabus, which both helps the model and
    // keeps the payload down.
    allowsEditing: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  return fromImageAsset(result.assets[0]);
}

/** Pick an existing photo of the syllabus. */
export async function pickSyllabusImage(): Promise<Attachment | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new SyllabusInputError('Nexora needs photo access to read your syllabus.');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: IMAGE_QUALITY,
    base64: true,
    allowsEditing: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  return fromImageAsset(result.assets[0]);
}

/** Pick a PDF (or an image file) from the device. */
export async function pickSyllabusFile(): Promise<Attachment | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
    // Web hands back base64 directly; native needs a filesystem read.
    base64: Platform.OS === 'web',
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const isPdf = asset.mimeType === 'application/pdf' || asset.name?.toLowerCase().endsWith('.pdf');

  // Check the declared size before reading, so a huge file is never loaded.
  if (typeof asset.size === 'number' && asset.size > MAX_BYTES) throw tooBig(asset.size);

  let data = (asset as { base64?: string }).base64;
  if (!data) {
    try {
      data = await new File(asset.uri).base64();
    } catch {
      throw new SyllabusInputError("Couldn't read that file. Try a different one.");
    }
  }

  const bytes = base64Bytes(data);
  if (bytes > MAX_BYTES) throw tooBig(bytes);

  return {
    kind: isPdf ? 'pdf' : 'image',
    data,
    mediaType: isPdf ? 'application/pdf' : (asset.mimeType || 'image/jpeg'),
    name: asset.name || (isPdf ? 'syllabus.pdf' : 'syllabus image'),
    bytes,
  };
}

export const humanSize = (bytes: number) =>
  bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
