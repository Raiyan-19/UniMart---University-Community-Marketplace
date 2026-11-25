import test from 'node:test';
import assert from 'node:assert';
import { db } from '../../server/db/store';

test('Product store lifecycle: creation, retrieval, and status update', async () => {
  const newProd = await db.createProduct({
    _id: `prod-test-${Date.now()}`,
    sellerId: 'user-raiyan',
    universityId: 'univ-baust',
    departmentId: 'dept-baust-cse',
    title: 'Calculus 9th Edition Test Book',
    description: 'Clean textbook with no pencil marks.',
    category: 'Books',
    price: 450,
    originalPrice: 700,
    condition: 'Like New',
    location: 'BAUST Library',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'],
    features: ['Original Print', 'Includes formula sheet'],
    status: 'active',
    views: 12,
    saves: 1,
    sellerType: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert.ok(newProd._id, 'Product ID should exist');
  const found = await db.findProductById(newProd._id);
  assert.strictEqual(found?.title, 'Calculus 9th Edition Test Book');

  const wishResult = await db.toggleWishlist('user-tanvir', newProd._id);
  assert.strictEqual(wishResult.isSaved, true);
  assert.ok(wishResult.count >= 1);
});

test('Offer negotiation sequence: Make offer and accept offer', async () => {
  const prod = (await db.getAllProducts()).find((p) => p.status === 'active');
  assert.ok(prod, 'Should have an active product to make offer on');

  const offer = await db.createOffer({
    _id: `offer-test-${Date.now()}`,
    productId: prod._id,
    buyerId: 'user-tanvir',
    sellerId: prod.sellerId,
    amount: Math.round(prod.price * 0.9),
    notes: 'Can pick up tomorrow at 2 PM',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert.strictEqual(offer.status, 'PENDING');

  const accepted = await db.updateOfferStatus(offer._id, 'ACCEPTED');
  assert.strictEqual(accepted?.status, 'ACCEPTED');

  const updatedProd = await db.findProductById(prod._id);
  assert.strictEqual(updatedProd?.status, 'sold');

  const transactions = await db.getTransactions();
  const tx = transactions.find((t) => t.offerId === offer._id);
  assert.ok(tx, 'Transaction should have been created on offer accept');
  assert.strictEqual(tx?.agreedPrice, offer.amount);
});

test('Chat messaging and conversation thread', async () => {
  const conv = await db.createConversation({
    _id: `conv-test-${Date.now()}`,
    productId: 'prod-1',
    participantIds: ['user-raiyan', 'user-tanvir'],
    lastMessage: 'Hello, is the laptop available?',
    lastMessageTimestamp: new Date().toISOString(),
    unreadCountByUser: { 'user-raiyan': 1, 'user-tanvir': 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert.ok(conv._id);

  const msg = await db.createMessage({
    _id: `msg-test-${Date.now()}`,
    conversationId: conv._id,
    senderId: 'user-tanvir',
    receiverId: 'user-raiyan',
    content: 'Can we meet at the campus library?',
    text: 'Can we meet at the campus library?',
    createdAt: new Date().toISOString(),
  });

  const messages = await db.getMessages(conv._id);
  assert.ok(messages.some((m) => m._id === msg._id));
});

test('Moderation reports and resolution', async () => {
  const report = await db.createReport({
    _id: `rep-test-${Date.now()}`,
    reporterId: 'user-tanvir',
    targetType: 'listing',
    targetId: 'prod-1',
    reason: 'Duplicate Listing',
    details: 'This item was posted twice in different categories.',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  assert.strictEqual(report.status, 'PENDING');

  const resolved = await db.updateReportStatus(report._id, 'RESOLVED', 'Reviewed by admin. Duplicate removed.');
  assert.strictEqual(resolved?.status, 'RESOLVED');
  assert.strictEqual(resolved?.resolutionNotes, 'Reviewed by admin. Duplicate removed.');
});
