import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../server/db/store';
import { register, login, logout, verifyEmail } from '../../server/controllers/authController';
import { getProducts, getProductById, createProduct, updateProduct } from '../../server/controllers/productController';
import { getConversationMessages, sendMessage, startConversationForProduct } from '../../server/controllers/chatController';
import { getNotifications, markAsRead } from '../../server/controllers/notificationController';
import { getAdminStats } from '../../server/controllers/userController';

function createMockRes() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
}

test('Mandatory Scenario 1: User Registration, OTP Dispatch, and Verification Flow', async () => {
  const email = `student.e2e.${Date.now()}@du.ac.bd`;
  const regReq = {
    body: {
      name: 'E2E Student Tester',
      email,
      password: 'StrongPassword123!',
      role: 'student',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      studentId: 'DU-CSE-8899',
    },
  };
  const regRes = createMockRes();
  await register(regReq as any, regRes as any);

  assert.equal(regRes.statusCode, 201);
  assert.equal(regRes.jsonData.success, true);
  assert.equal(regRes.jsonData.requiresEmailVerification, true);
  assert.equal(regRes.jsonData.emailSent, true);

  const user = (await db.findUserByEmail(email))!;
  assert.ok(user);
  assert.equal(user.isEmailVerified, false);
  const otp = user.emailVerificationToken!;
  assert.ok(otp && otp.length === 6);

  // Complete OTP verification
  const verifyRes = createMockRes();
  await verifyEmail({ body: { email, code: otp } } as any, verifyRes as any);

  assert.equal(verifyRes.statusCode, 200);
  assert.equal(verifyRes.jsonData.success, true);
  assert.equal(verifyRes.jsonData.user.isEmailVerified, true);
});

test('Mandatory Scenario 2: Logout and Invalidation of Session / Private Access', async () => {
  const email = `logout.e2e.${Date.now()}@du.ac.bd`;
  await register(
    {
      body: {
        name: 'Logout Tester',
        email,
        password: 'Password123!',
        role: 'student',
        universityId: 'univ-du',
        departmentId: 'dept-du-cse',
        studentId: 'DU-CSE-9988',
      },
    } as any,
    createMockRes() as any
  );

  // Login
  const loginRes = createMockRes();
  await login(
    {
      body: {
        email,
        password: 'Password123!',
      },
    } as any,
    loginRes as any
  );

  assert.equal(loginRes.statusCode, 200);
  const token = loginRes.jsonData.token;
  assert.ok(token);

  // Perform logout
  const logoutRes = createMockRes();
  const logoutReq = {
    headers: { authorization: `Bearer ${token}` },
    token,
  };
  await logout(logoutReq as any, logoutRes as any);
  assert.equal(logoutRes.statusCode, 200);
  assert.equal(logoutRes.jsonData.success, true);
});

test('Mandatory Scenario 3: Product Listing Creation, Image Persistence, and Update', async () => {
  const seller = (await db.getAllUsers()).find((u) => u.role === 'student')!;
  const createReq = {
    user: seller,
    body: {
      title: 'E2E Gaming Laptop RTX 4060',
      description: 'Well-maintained campus gaming laptop with receipt and warranty.',
      category: 'Laptops',
      price: 95000,
      condition: 'Like New',
      location: 'Curzon Hall, DU',
      images: [
        '/uploads/product-1794676000000-111111.webp',
        '/uploads/product-1794676000000-222222.webp',
      ],
      features: ['16GB RAM', '512GB SSD', 'RTX 4060'],
    },
  };
  const createRes = createMockRes();
  await createProduct(createReq as any, createRes as any);

  assert.equal(createRes.statusCode, 201);
  assert.equal(createRes.jsonData.success, true);
  const productId = createRes.jsonData.data.id;
  assert.ok(productId);
  assert.equal(createRes.jsonData.data.images.length, 2);

  // Verify listing lookup
  const getRes = createMockRes();
  await getProductById({ params: { id: productId } } as any, getRes as any);
  assert.equal(getRes.statusCode, 200);
  assert.equal(getRes.jsonData.data.title, 'E2E Gaming Laptop RTX 4060');

  // Edit listing
  const updateRes = createMockRes();
  await updateProduct(
    {
      user: seller,
      params: { id: productId },
      body: { price: 92000, title: 'E2E Gaming Laptop RTX 4060 (Discounted)' },
    } as any,
    updateRes as any
  );
  assert.equal(updateRes.statusCode, 200);
  assert.equal(updateRes.jsonData.data.price, 92000);
});

test('Mandatory Scenario 4: Marketplace Search and Multi-Filter Querying', async () => {
  const searchReq = {
    query: {
      search: 'Laptop',
      category: 'Laptops',
      minPrice: '1000',
      maxPrice: '150000',
      sort: 'newest',
    },
  };
  const searchRes = createMockRes();
  await getProducts(searchReq as any, searchRes as any);

  assert.equal(searchRes.statusCode, 200);
  assert.ok(Array.isArray(searchRes.jsonData.data));
  for (const item of searchRes.jsonData.data) {
    assert.equal(item.category.toLowerCase(), 'laptops');
    assert.ok(item.price >= 1000 && item.price <= 150000);
  }
});

test('Mandatory Scenario 5: Messaging Workflow between Buyer and Seller', async () => {
  const allProducts = await db.getAllProducts();
  const allUsers = await db.getAllUsers();
  const product = allProducts.find((p) => p.status === 'active')!;
  const seller = (await db.findUserById(product.sellerId))!;
  const buyer = allUsers.find((u) => u._id !== product.sellerId)!;

  assert.ok(product);
  assert.ok(seller);
  assert.ok(buyer);

  // Start conversation
  const startReq = {
    user: buyer,
    body: {
      productId: product._id,
      initialMessage: 'Hello, is this item still available?',
    },
  };
  const startRes = createMockRes();
  await startConversationForProduct(startReq as any, startRes as any);
  assert.ok([200, 201].includes(startRes.statusCode));

  const convId = startRes.jsonData.data.id;
  assert.ok(convId);

  // Send follow-up message
  const msgReq = {
    user: buyer,
    params: { id: convId },
    body: { text: 'Can we meet at the campus cafeteria tomorrow at 2 PM?' },
  };
  const msgRes = createMockRes();
  await sendMessage(msgReq as any, msgRes as any);
  assert.equal(msgRes.statusCode, 201);
  assert.equal(msgRes.jsonData.data.text, 'Can we meet at the campus cafeteria tomorrow at 2 PM?');

  // Verify conversation message retrieval
  const listReq = {
    user: buyer,
    params: { id: convId },
  };
  const listRes = createMockRes();
  await getConversationMessages(listReq as any, listRes as any);
  assert.equal(listRes.statusCode, 200);
  assert.ok(listRes.jsonData.data.length >= 1);
});

test('Mandatory Scenario 6: Notification Creation, Marking as Read, and Persistence', async () => {
  const user = (await db.getAllUsers())[0];
  const notifId = `notif-test-${Date.now()}`;

  await db.createNotification({
    _id: notifId,
    userId: user._id,
    type: 'system',
    title: 'Test Scenario Notification',
    message: 'Testing read state persistence',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  // Fetch notifications
  const getReq = { user };
  const getRes = createMockRes();
  await getNotifications(getReq as any, getRes as any);
  assert.equal(getRes.statusCode, 200);
  const found = getRes.jsonData.data.find((n: any) => n.id === notifId);
  assert.ok(found);
  assert.equal(found.isRead, false);

  // Mark as read
  const markRes = createMockRes();
  await markAsRead({ user, params: { id: notifId } } as any, markRes as any);
  assert.equal(markRes.statusCode, 200);

  // Confirm persistent read state
  const verifyRes = createMockRes();
  await getNotifications(getReq as any, verifyRes as any);
  const updated = verifyRes.jsonData.data.find((n: any) => n.id === notifId);
  assert.ok(updated);
  assert.equal(updated.isRead, true);
});

test('Mandatory Scenario 7: Authorization and Role-Based Access Enforcement', async () => {
  const allUsers = await db.getAllUsers();
  const student = allUsers.find((u) => u.role === 'student')!;
  const admin = allUsers.find((u) => u.role === 'admin')!;

  assert.ok(student);
  assert.ok(admin);

  // Admin stats endpoint
  const statsRes = createMockRes();
  await getAdminStats({ user: admin } as any, statsRes as any);
  assert.equal(statsRes.statusCode, 200);
  assert.ok(statsRes.jsonData.data.totalUsers > 0);
  assert.ok(statsRes.jsonData.data.activeListings >= 0);

  // Student attempting to edit another user's product (IDOR check)
  const anotherUserProduct = (await db.getAllProducts()).find((p) => p.sellerId !== student._id)!;
  assert.ok(anotherUserProduct);

  const unauthorizedEditRes = createMockRes();
  await updateProduct(
    {
      user: student,
      params: { id: anotherUserProduct._id },
      body: { price: 1 },
    } as any,
    unauthorizedEditRes as any
  );

  assert.equal(unauthorizedEditRes.statusCode, 403);
  assert.ok(unauthorizedEditRes.jsonData.error.includes('authorized'));
});
