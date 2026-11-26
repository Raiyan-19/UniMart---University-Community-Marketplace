import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateImageFile,
  validateImageSlots,
  MAX_IMAGE_COUNT,
} from './validation';
import { db } from '../../server/db/store';
import { uploadImage } from '../../server/controllers/uploadController';

test('1. Upload one image from local device: format & size validation passes', () => {
  const singleFile = {
    name: 'laptop_photo.png',
    size: 1024 * 500, // 500 KB
    type: 'image/png',
  };

  const validation = validateImageFile(singleFile);
  assert.equal(validation.isValid, true);
  assert.equal(validation.error, undefined);

  const slotCheck = validateImageSlots(0, 1, MAX_IMAGE_COUNT);
  assert.equal(slotCheck.allowedCount, 1);
  assert.equal(slotCheck.isExceeded, false);
});

test('2. Upload multiple images within 5 image limit passes', () => {
  const files = [
    { name: 'front.jpg', size: 1024 * 300, type: 'image/jpeg' },
    { name: 'back.webp', size: 1024 * 400, type: 'image/webp' },
    { name: 'side.png', size: 1024 * 200, type: 'image/png' },
  ];

  files.forEach((f) => {
    const val = validateImageFile(f);
    assert.equal(val.isValid, true, `File ${f.name} should be valid`);
  });

  const slotCheck = validateImageSlots(0, files.length, MAX_IMAGE_COUNT);
  assert.equal(slotCheck.allowedCount, 3);
  assert.equal(slotCheck.isExceeded, false);
});

test('3. Upload more than 5 images: rejects excess files and enforces max 5', () => {
  const currentImages = ['/uploads/img_1.jpg', '/uploads/img_2.jpg', '/uploads/img_3.jpg'];
  const incomingFilesCount = 4; // Total would be 7 > 5

  const slotCheck = validateImageSlots(currentImages.length, incomingFilesCount, MAX_IMAGE_COUNT);
  assert.equal(slotCheck.isExceeded, true);
  assert.equal(slotCheck.allowedCount, 2); // only 2 slots remaining (5 - 3 = 2)
  assert.ok(slotCheck.error?.includes('Maximum 5'));

  // If already at 5 images
  const fullSlotCheck = validateImageSlots(5, 1, MAX_IMAGE_COUNT);
  assert.equal(fullSlotCheck.allowedCount, 0);
  assert.equal(fullSlotCheck.isExceeded, true);
  assert.ok(fullSlotCheck.error?.includes('Maximum 5 images allowed'));
});

test('4. Upload unsupported file: rejected with descriptive error message', () => {
  const exeFile = { name: 'virus.exe', size: 1024 * 100, type: 'application/x-msdownload' };
  const pdfFile = { name: 'document.pdf', size: 1024 * 200, type: 'application/pdf' };
  const gifFile = { name: 'animation.gif', size: 1024 * 100, type: 'image/gif' };

  const valExe = validateImageFile(exeFile);
  assert.equal(valExe.isValid, false);
  assert.ok(valExe.error?.includes('unsupported format'));

  const valPdf = validateImageFile(pdfFile);
  assert.equal(valPdf.isValid, false);
  assert.ok(valPdf.error?.includes('unsupported format'));

  const valGif = validateImageFile(gifFile);
  assert.equal(valGif.isValid, false);
  assert.ok(valGif.error?.includes('unsupported format'));
});

test('5. Upload image larger than 5 MB: rejected with size error', () => {
  const oversizedFile = {
    name: 'huge_photo.jpg',
    size: 6 * 1024 * 1024, // 6 MB > 5 MB
    type: 'image/jpeg',
  };

  const validation = validateImageFile(oversizedFile);
  assert.equal(validation.isValid, false);
  assert.ok(validation.error?.includes('exceeds the 5 MB size limit'));
});

test('6. Remove an uploaded image from list', () => {
  let images = ['/uploads/photo1.jpg', '/uploads/photo2.jpg', '/uploads/photo3.jpg'];
  const removeIndex = 1; // remove photo2

  images = images.filter((_, idx) => idx !== removeIndex);
  assert.equal(images.length, 2);
  assert.deepEqual(images, ['/uploads/photo1.jpg', '/uploads/photo3.jpg']);
  // Cover photo is still the first item
  assert.equal(images[0], '/uploads/photo1.jpg');
});

test('7. Submit a listing with uploaded local images', async () => {
  const uploadedUrls = ['/uploads/local_device_item1.jpg', '/uploads/local_device_item2.png'];

  const newProd = await db.createProduct({
    _id: `prod-upload-test-${Date.now()}`,
    sellerId: 'user-raiyan',
    universityId: 'univ-baust',
    departmentId: 'dept-baust-cse',
    title: 'Local Device Uploaded Calculator',
    description: 'Scientific calculator in pristine condition with box.',
    category: 'Electronics',
    price: 950,
    condition: 'Like New',
    location: 'BAUST Campus Plaza',
    images: uploadedUrls,
    features: ['Original Box', 'Extra Battery'],
    status: 'active',
    views: 0,
    saves: 0,
    sellerType: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert.ok(newProd._id);
  assert.deepEqual(newProd.images, uploadedUrls);
});

test('8. Verify images persist after database refresh / lookup', async () => {
  const testId = `prod-persist-test-${Date.now()}`;
  const uploadedUrls = ['/uploads/persisted_img_1.jpg', '/uploads/persisted_img_2.webp'];

  await db.createProduct({
    _id: testId,
    sellerId: 'user-raiyan',
    universityId: 'univ-baust',
    departmentId: 'dept-baust-cse',
    title: 'Persisted Item',
    description: 'Testing persistence of uploaded URLs.',
    category: 'University Gear',
    price: 300,
    condition: 'Good Condition',
    location: 'Hostel 3',
    images: uploadedUrls,
    features: [],
    status: 'active',
    views: 1,
    saves: 0,
    sellerType: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Re-fetch from DB as if page was refreshed
  const retrieved = await db.findProductById(testId);
  assert.ok(retrieved, 'Product should be found in db');
  assert.equal(retrieved.images.length, 2);
  assert.equal(retrieved.images[0], '/uploads/persisted_img_1.jpg');
  assert.equal(retrieved.images[1], '/uploads/persisted_img_2.webp');
});

test('9. Verify uploaded images appear in marketplace listings query', async () => {
  const testId = `prod-marketplace-view-${Date.now()}`;
  const uploadedUrls = ['/uploads/marketplace_cover.jpg'];

  await db.createProduct({
    _id: testId,
    sellerId: 'user-raiyan',
    universityId: 'univ-baust',
    departmentId: 'dept-baust-cse',
    title: 'Marketplace View Item',
    description: 'Listing to test appearance in marketplace cards.',
    category: 'Laptops',
    price: 35000,
    condition: 'Like New',
    location: 'Computer Lab 1',
    images: uploadedUrls,
    features: ['16GB RAM'],
    status: 'active',
    views: 5,
    saves: 2,
    sellerType: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const allActive = (await db.getAllProducts()).filter((p) => p.status === 'active');
  const found = allActive.find((p) => p._id === testId);
  assert.ok(found, 'Product should be in active listings');
  assert.equal(found.images[0], '/uploads/marketplace_cover.jpg');
});

test('Backend controller uploadImage endpoint: saves valid image and rejects bad input', async () => {
  // Test mock request / response for controller
  const mockUser = {
    _id: 'user-raiyan',
    email: 'raiyan@student.baust.edu.bd',
    name: 'Sultan Raiyan',
    role: 'student' as const,
    universityId: 'univ-baust',
    departmentId: 'dept-baust-cse',
    isVerified: true,
    status: 'active' as const,
    passwordHash: 'hash',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Rejects unauthenticated request
  let unauthStatus = 0;
  let unauthJson: any = null;
  await uploadImage(
    { user: undefined, body: {} } as any,
    {
      status: (s: number) => {
        unauthStatus = s;
        return { json: (j: any) => (unauthJson = j) };
      },
    } as any
  );
  assert.equal(unauthStatus, 401);
  assert.equal(unauthJson.success, false);

  // 2. Rejects unsupported mime format
  let badFormatStatus = 0;
  let badFormatJson: any = null;
  await uploadImage(
    {
      user: mockUser,
      body: {
        data: Buffer.from('plain text file').toString('base64'),
        filename: 'notes.txt',
        mimeType: 'text/plain',
      },
    } as any,
    {
      status: (s: number) => {
        badFormatStatus = s;
        return { json: (j: any) => (badFormatJson = j) };
      },
    } as any
  );
  assert.equal(badFormatStatus, 400);
  assert.ok(badFormatJson.error?.includes('Unsupported image format'));

  // 3. Successfully uploads valid PNG image
  // Create a minimal 1x1 PNG image buffer
  const samplePngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  let successJson: any = null;
  await uploadImage(
    {
      user: mockUser,
      body: {
        data: samplePngBase64,
        filename: 'pixel.png',
        mimeType: 'image/png',
      },
    } as any,
    {
      json: (j: any) => (successJson = j),
    } as any
  );

  assert.equal(successJson.success, true);
  assert.ok(successJson.url.startsWith('/uploads/img_'));
  assert.ok(successJson.filename.endsWith('.png'));

  // Verify file was physically written to public/uploads
  const savedFilePath = path.resolve(process.cwd(), 'public', 'uploads', successJson.filename);
  assert.ok(fs.existsSync(savedFilePath), 'Uploaded file should exist on disk');

  // Clean up test file
  fs.unlinkSync(savedFilePath);
});

