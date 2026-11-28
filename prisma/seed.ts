import 'dotenv/config';
import crypto from 'node:crypto';
import { prisma } from '../server/db/prisma';

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, generatedSalt, 64).toString('hex');
  return { hash, salt: generatedSalt };
}

export async function seedDatabase(): Promise<void> {
  const existingUsersCount = await prisma.user.count();
  if (existingUsersCount > 0) {
    console.log('[Seed] Database already contains data. Skipping seed.');
    return;
  }

  console.log('[Seed] Populating UniMart PostgreSQL database...');

  const universities = [
    {
      id: 'univ-baust',
      name: 'Bangladesh Army University of Science and Technology',
      shortName: 'BAUST',
      domain: 'baust.edu.bd',
      location: 'Saidpur Cantonment, Nilphamari',
      logo: '🎓',
    },
    {
      id: 'univ-du',
      name: 'University of Dhaka',
      shortName: 'DU',
      domain: 'du.ac.bd',
      location: 'Dhaka 1000',
      logo: '🏛️',
    },
    {
      id: 'univ-brur',
      name: 'Begum Rokeya University',
      shortName: 'BRUR',
      domain: 'brur.ac.bd',
      location: 'Rangpur',
      logo: '🏫',
    },
    {
      id: 'univ-ru',
      name: 'Rajshahi University',
      shortName: 'RU',
      domain: 'ru.ac.bd',
      location: 'Motihar, Rajshahi',
      logo: '📚',
    },
  ];

  for (const u of universities) {
    await prisma.university.upsert({
      where: { id: u.id },
      update: {},
      create: u,
    });
  }

  const departments = [
    { id: 'dept-baust-cse', name: 'Computer Science and Engineering', code: 'CSE', universityId: 'univ-baust' },
    { id: 'dept-baust-eee', name: 'Electrical and Electronic Engineering', code: 'EEE', universityId: 'univ-baust' },
    { id: 'dept-baust-me', name: 'Mechanical Engineering', code: 'ME', universityId: 'univ-baust' },
    { id: 'dept-baust-ce', name: 'Civil Engineering', code: 'CE', universityId: 'univ-baust' },
    { id: 'dept-baust-bba', name: 'Business Administration', code: 'BBA', universityId: 'univ-baust' },
    { id: 'dept-baust-eng', name: 'English', code: 'ENG', universityId: 'univ-baust' },
    { id: 'dept-du-cse', name: 'Computer Science & Engineering', code: 'CSE', universityId: 'univ-du' },
    { id: 'dept-du-eee', name: 'Electrical & Electronic Engineering', code: 'EEE', universityId: 'univ-du' },
    { id: 'dept-du-econ', name: 'Economics', code: 'ECON', universityId: 'univ-du' },
    { id: 'dept-du-iba', name: 'Institute of Business Administration', code: 'IBA', universityId: 'univ-du' },
    { id: 'dept-brur-cse', name: 'Computer Science and Engineering', code: 'CSE', universityId: 'univ-brur' },
    { id: 'dept-brur-eee', name: 'Electrical and Electronic Engineering', code: 'EEE', universityId: 'univ-brur' },
    { id: 'dept-brur-math', name: 'Mathematics', code: 'MATH', universityId: 'univ-brur' },
    { id: 'dept-ru-cse', name: 'Computer Science and Engineering', code: 'CSE', universityId: 'univ-ru' },
    { id: 'dept-ru-physics', name: 'Physics', code: 'PHY', universityId: 'univ-ru' },
    { id: 'dept-ru-law', name: 'Law and Justice', code: 'LAW', universityId: 'univ-ru' },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: {},
      create: d,
    });
  }

  const p1 = hashPassword('password123');
  const p2 = hashPassword('password123');
  const p3 = hashPassword('password123');
  const p4 = hashPassword('password123');
  const pAdmin = hashPassword('admin123');

  const users = [
    {
      id: 'user-raiyan',
      name: 'Raiyan',
      email: 'raiyan19@student.baust.edu.bd',
      passwordHash: p1.hash,
      salt: p1.salt,
      role: 'student',
      universityId: 'univ-baust',
      departmentId: 'dept-baust-cse',
      phone: '+880 1712345678',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
      bio: 'CSE student at BAUST. Interested in tech, learning, and helping others. Feel free to reach out!',
      studentId: '20221015',
      currentSemester: '3rd Year, 1st Semester',
      isEmailVerified: true,
      isVerified: true,
      status: 'active',
    },
    {
      id: 'user-teacher-amin',
      name: 'Dr. Aminul Islam',
      email: 'aminul@baust.edu.bd',
      passwordHash: p2.hash,
      salt: p2.salt,
      role: 'teacher',
      universityId: 'univ-baust',
      departmentId: 'dept-baust-cse',
      phone: '+880 1798765432',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
      bio: 'Associate Professor, Department of Computer Science and Engineering. Happy to guide students and share academic materials.',
      designation: 'Associate Professor',
      isEmailVerified: true,
      isVerified: true,
      status: 'active',
    },
    {
      id: 'user-admin',
      name: 'Sara Khan (Admin)',
      email: 'admin@unimart.edu.bd',
      passwordHash: pAdmin.hash,
      salt: pAdmin.salt,
      role: 'admin',
      universityId: 'univ-baust',
      departmentId: 'dept-baust-cse',
      phone: '+880 1812340000',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
      bio: 'UniMart Campus Administrator and System Coordinator.',
      isEmailVerified: true,
      isVerified: true,
      status: 'active',
    },
    {
      id: 'user-tanvir',
      name: 'Tanvir Hasan',
      email: 'tanvir21@student.baust.edu.bd',
      passwordHash: p3.hash,
      salt: p3.salt,
      role: 'student',
      universityId: 'univ-baust',
      departmentId: 'dept-baust-eee',
      phone: '+880 1755112233',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
      bio: 'EEE student at BAUST looking for affordable electronics and study materials.',
      studentId: '20212044',
      currentSemester: '4th Year, 1st Semester',
      isEmailVerified: true,
      isVerified: true,
      status: 'active',
    },
    {
      id: 'user-sadman',
      name: 'Sadman Sakib',
      email: 'sadman@du.ac.bd',
      passwordHash: p4.hash,
      salt: p4.salt,
      role: 'student',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      phone: '+880 1911223344',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=160&q=80',
      bio: 'Final year CS student at Dhaka University. Graduating soon!',
      studentId: '2020-312-018',
      currentSemester: '4th Year, 2nd Semester',
      isEmailVerified: true,
      isVerified: true,
      status: 'active',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: u,
    });
  }

  const products = [
    {
      id: 'prod-1',
      sellerId: 'user-raiyan',
      universityId: 'univ-baust',
      departmentId: 'dept-baust-cse',
      title: 'Lenovo IdeaPad 5',
      description: 'Selling my Lenovo IdeaPad 5. Used for 1.5 years. Still in great condition and works perfectly. Upgraded to desktop, hence selling. Includes original 65W fast charger.',
      category: 'Laptops',
      price: 45000,
      originalPrice: 52000,
      condition: 'Good Condition',
      location: 'BAUST (On Campus)',
      images: [
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      ],
      features: [
        'AMD Ryzen 5 5500U (6 cores, 12 threads)',
        '16GB DDR4 RAM',
        '512GB NVMe SSD',
        '14" Full HD IPS Display',
        'Backlit Keyboard & Fingerprint Reader',
        'Original Charger Included',
      ],
      status: 'active',
      views: 0,
      saves: 0,
      sellerType: 'student',
    },
    {
      id: 'prod-2',
      sellerId: 'user-teacher-amin',
      universityId: 'univ-baust',
      departmentId: 'dept-baust-cse',
      title: 'Discrete Mathematics (Hoffman)',
      description: 'Standard textbook for Computer Science fundamentals. Clean pages, no torn corners. Very helpful for algorithms course.',
      category: 'Books',
      price: 600,
      originalPrice: 850,
      condition: 'Good Condition',
      location: 'BAUST (On Campus)',
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'],
      features: ['Hardcover edition', 'Complete problem sets', 'No ink markings'],
      status: 'sold',
      views: 0,
      saves: 0,
      sellerType: 'teacher',
    },
    {
      id: 'prod-3',
      sellerId: 'user-raiyan',
      universityId: 'univ-baust',
      departmentId: 'dept-baust-cse',
      title: 'GTX 1660 Super (ZOTAC Gaming)',
      description: 'ZOTAC GeForce GTX 1660 Super 6GB GDDR6. Cleaned regularly with thermal paste replaced 3 months ago. Never used for crypto mining.',
      category: 'PC Components',
      price: 18000,
      originalPrice: 24000,
      condition: 'Like New',
      location: 'BAUST (On Campus)',
      images: ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80'],
      features: ['6GB GDDR6 VRAM', 'Dual fan cooling', 'Original box included'],
      status: 'active',
      views: 0,
      saves: 1,
      sellerType: 'student',
    },
    {
      id: 'prod-4',
      sellerId: 'user-raiyan',
      universityId: 'univ-baust',
      departmentId: 'dept-baust-cse',
      title: 'Redmi Buds 4 Active',
      description: 'Brand new wireless earbuds in sealed packaging. Won in university hackathon, do not need.',
      category: 'Electronics',
      price: 2500,
      originalPrice: 3000,
      condition: 'New',
      location: 'BAUST (On Campus)',
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'],
      features: ['12mm Dynamic Drivers', 'Up to 28 hours battery life', 'Bluetooth 5.3'],
      status: 'active',
      views: 0,
      saves: 0,
      sellerType: 'student',
    },
    {
      id: 'prod-5',
      sellerId: 'user-raiyan',
      universityId: 'univ-baust',
      departmentId: 'dept-baust-cse',
      title: 'Ergonomic Office Chair',
      description: 'Black mesh high-back chair with lumbar support and pneumatic height adjustment. Selling due to room relocation.',
      category: 'Others',
      price: 4000,
      originalPrice: 6500,
      condition: 'Good Condition',
      location: 'BAUST (Saidpur)',
      images: ['https://images.unsplash.com/photo-1580481077195-c3a821a58875?auto=format&fit=crop&w=800&q=80'],
      features: ['Breathable mesh back', 'Adjustable armrests', 'Smooth caster wheels'],
      status: 'inactive',
      views: 0,
      saves: 0,
      sellerType: 'student',
    },
    {
      id: 'prod-6',
      sellerId: 'user-raiyan',
      universityId: 'univ-baust',
      departmentId: 'dept-baust-cse',
      title: 'BAUST Official Hoodie (L)',
      description: 'Dark green campus hoodie with embroidered BAUST lettering. High quality fleece, warm for winter.',
      category: 'University Gear',
      price: 1200,
      condition: 'Like New',
      location: 'BAUST (On Campus)',
      images: ['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'],
      features: ['Size Large', 'Heavyweight cotton fleece', 'Front pouch pocket'],
      status: 'active',
      views: 0,
      saves: 0,
      sellerType: 'student',
    },
    {
      id: 'prod-7',
      sellerId: 'user-sadman',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      title: 'Arduino Uno R3 Microcontroller Kit',
      description: 'Official kit with breadboard, sensors, jumper wires, servo motor, and LEDs. Perfect for embedded systems course.',
      category: 'Electronics',
      price: 1800,
      originalPrice: 2400,
      condition: 'Good Condition',
      location: 'DU (Curzon Hall)',
      images: ['https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80'],
      status: 'active',
      views: 0,
      saves: 1,
      sellerType: 'student',
    },
    {
      id: 'prod-8',
      sellerId: 'user-sadman',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      title: 'Calculus: Early Transcendentals (Stewart)',
      description: 'Essential reference book for 1st-year mathematics. Clean condition with formula sheets inside.',
      category: 'Books',
      price: 800,
      originalPrice: 1200,
      condition: 'Good Condition',
      location: 'DU (Muktijoddha Hall)',
      images: ['https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=800&q=80'],
      status: 'active',
      views: 0,
      saves: 1,
      sellerType: 'student',
    },
    {
      id: 'prod-9',
      sellerId: 'user-sadman',
      universityId: 'univ-du',
      departmentId: 'dept-du-cse',
      title: 'Redragon K552 RGB Mechanical Keyboard',
      description: 'Compact 87-key tenkeyless keyboard with clicky Blue switches and rainbow backlighting.',
      category: 'PC Components',
      price: 2700,
      condition: 'Like New',
      location: 'DU',
      images: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80'],
      status: 'active',
      views: 0,
      saves: 0,
      sellerType: 'student',
    },
    {
      id: 'prod-10',
      sellerId: 'user-raiyan',
      universityId: 'univ-baust',
      departmentId: 'dept-baust-cse',
      title: 'CSE 3107 Complete Hand-Written Notes & Questions',
      description: 'Comprehensive organized notes covering the entire curriculum, solved past midterms, and lab assignments.',
      category: 'Notes & Materials',
      price: 300,
      condition: 'New',
      location: 'BAUST',
      images: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'],
      status: 'active',
      views: 0,
      saves: 0,
      sellerType: 'student',
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }

  for (const pid of ['prod-3', 'prod-7', 'prod-8']) {
    await prisma.wishlist.upsert({
      where: { userId_productId: { userId: 'user-raiyan', productId: pid } },
      update: {},
      create: { userId: 'user-raiyan', productId: pid },
    });
  }

  await prisma.offer.upsert({
    where: { id: 'offer-1' },
    update: {},
    create: {
      id: 'offer-1',
      productId: 'prod-1',
      buyerId: 'user-tanvir',
      sellerId: 'user-raiyan',
      amount: 42000,
      notes: 'Can pay in cash tomorrow on campus if accepted.',
      status: 'PENDING',
    },
  });

  await prisma.offer.upsert({
    where: { id: 'offer-2' },
    update: {},
    create: {
      id: 'offer-2',
      productId: 'prod-2',
      buyerId: 'user-raiyan',
      sellerId: 'user-teacher-amin',
      amount: 550,
      notes: 'Would love to pick it up after class.',
      status: 'ACCEPTED',
    },
  });

  await prisma.transaction.upsert({
    where: { id: 'trans-1' },
    update: {},
    create: {
      id: 'trans-1',
      offerId: 'offer-2',
      productId: 'prod-2',
      buyerId: 'user-raiyan',
      sellerId: 'user-teacher-amin',
      agreedPrice: 550,
      status: 'COMPLETED',
    },
  });

  await prisma.review.upsert({
    where: { id: 'rev-1' },
    update: {},
    create: {
      id: 'rev-1',
      transactionId: 'trans-1',
      productId: 'prod-2',
      reviewerId: 'user-raiyan',
      targetUserId: 'user-teacher-amin',
      rating: 5,
      comment: 'Professor was very courteous. Book was in immaculate condition. Highly recommended seller!',
    },
  });

  const conversations = [
    {
      id: 'conv-1',
      productId: 'prod-1',
      participantIds: ['user-tanvir', 'user-raiyan'],
      lastMessage: 'Looks good! Can we meet on campus tomorrow?',
      lastMessageAt: new Date(Date.now() - 10 * 60 * 1000),
      unreadCount: { 'user-raiyan': 1 },
    },
    {
      id: 'conv-teacher-amin',
      productId: 'prod-4',
      participantIds: ['user-teacher-amin', 'user-raiyan'],
      lastMessage: 'Can we meet at the campus cafeteria tomorrow at 2 PM?',
      lastMessageAt: new Date(Date.now() - 5 * 60 * 1000),
      unreadCount: { 'user-raiyan': 0 },
    },
    {
      id: 'conv-offer-sadman',
      productId: 'prod-2',
      participantIds: ['user-sadman', 'user-raiyan'],
      lastMessage: 'Made an official offer of ৳ 1,800',
      lastMessageAt: new Date(Date.now() - 2 * 60 * 1000),
      unreadCount: { 'user-raiyan': 1 },
    },
  ];

  for (const c of conversations) {
    await prisma.conversation.upsert({ where: { id: c.id }, update: {}, create: c });
  }

  const messages = [
    { id: 'msg-1', conversationId: 'conv-1', senderId: 'user-tanvir', receiverId: 'user-raiyan', content: 'Hi! Is the Lenovo IdeaPad 5 still available?', isRead: true },
    { id: 'msg-2', conversationId: 'conv-1', senderId: 'user-raiyan', receiverId: 'user-tanvir', content: "Yes, it's still available.", isRead: true },
    { id: 'msg-3', conversationId: 'conv-1', senderId: 'user-tanvir', receiverId: 'user-raiyan', content: 'Great! What is the current battery health and are there any scratches?', isRead: true },
    { id: 'msg-4', conversationId: 'conv-1', senderId: 'user-raiyan', receiverId: 'user-tanvir', content: 'Battery lasts about 5 hours for coding/browsing. Minor wear on bottom rubber feet, screen is scratchless.', isRead: true },
    { id: 'msg-5', conversationId: 'conv-1', senderId: 'user-tanvir', receiverId: 'user-raiyan', content: 'Looks good! Can we meet on campus tomorrow?', isRead: false },
    { id: 'msg-amin-1', conversationId: 'conv-teacher-amin', senderId: 'user-teacher-amin', receiverId: 'user-raiyan', content: 'Hello, is this item still available?', isRead: true },
    { id: 'msg-amin-2', conversationId: 'conv-teacher-amin', senderId: 'user-teacher-amin', receiverId: 'user-raiyan', content: 'Can we meet at the campus cafeteria tomorrow at 2 PM?', isRead: true },
    { id: 'msg-sadman-offer-1', conversationId: 'conv-offer-sadman', senderId: 'user-sadman', receiverId: 'user-raiyan', content: 'Made an official offer of ৳ 1,800', isOffer: true, offerAmount: 1800, isRead: false },
  ];

  for (const m of messages) {
    await prisma.message.upsert({ where: { id: m.id }, update: {}, create: m });
  }

  for (const name of ['PC & Software', 'Academic Help', 'Design & Creative', 'Tutoring']) {
    await prisma.serviceCategory.upsert({ where: { name }, update: {}, create: { name } });
  }

  const graduationSales = [
    {
      id: 'gs-1',
      studentId: 'user-raiyan',
      universityId: 'univ-baust',
      departmentCode: 'CSE',
      graduatingTerm: 'Graduating Fall 2026',
      quote: "Grateful for the memories, now it's time to pass it on.",
      itemCount: 8,
      featuredProductIds: ['prod-1', 'prod-3', 'prod-5', 'prod-6'],
    },
    {
      id: 'gs-2',
      studentId: 'user-sadman',
      universityId: 'univ-du',
      departmentCode: 'CSE',
      graduatingTerm: 'Graduating Spring 2026',
      quote: 'New chapter ahead — make these useful for someone else!',
      itemCount: 6,
      featuredProductIds: ['prod-7', 'prod-8', 'prod-9'],
    },
  ];

  for (const gs of graduationSales) {
    await prisma.graduationSale.upsert({ where: { id: gs.id }, update: {}, create: gs });
  }

  const notifications = [
    { id: 'notif-1', userId: 'user-raiyan', type: 'message', title: 'New message from Tanvir H.', message: 'Hi! Is the Lenovo IdeaPad 5 still available?', isRead: false },
    { id: 'notif-2', userId: 'user-raiyan', type: 'wishlist', title: 'Someone saved your listing', message: 'Your "Mechanical Keyboard" has been saved by another student.', isRead: false },
    { id: 'notif-offer', userId: 'user-raiyan', type: 'offer', title: 'New Offer Received! ৳ 42,000', message: 'Tanvir H. made an offer of ৳ 42,000 for your Lenovo IdeaPad 5.', isRead: false },
  ];

  for (const n of notifications) {
    await prisma.notification.upsert({ where: { id: n.id }, update: {}, create: n });
  }

  const guides = [
    { id: 'guide-1', category: 'freshers', title: 'Fresher Starter Kit: Essential Books & Instruments', summary: 'How to acquire 1st-year engineering textbooks, drawing mini-drafters, and lab coats on a student budget.', content: 'New to campus? Do not buy brand-new expensive reference books or lab gear. Seniors graduate each semester and list Discrete Mathematics, Calculus, Electrical Engineering basics, and mini drafters at 60-70% lower prices on UniMart. Filter by your department to find verified peer listings.', order: 1 },
    { id: 'guide-2', category: 'freshers', title: 'Connecting With Verified Seniors for Academic Guidance', summary: 'Find course notes, lab setup help, and project guidance safely on campus.', content: 'Browse the Campus Services section whenever you are stuck configuring coding compilers, IDEs, or understanding lab assignments. All service providers are verified students or faculty members from your university community.', order: 2 },
    { id: 'guide-3', category: 'trade', title: 'Seller Rules: Creating a Trustworthy Listing', summary: 'Capture genuine photos, state battery/cosmetic condition, and set student-friendly prices.', content: 'Always take original clear photos of the item in well-lit areas. Clearly mention cosmetic condition (e.g. scratches, battery health, original invoice availability). Unrealistic pricing slows down sales — check average peer listings before setting your price.', order: 1 },
    { id: 'guide-4', category: 'trade', title: 'Buyer Etiquette: Negotiation & Closing Deals', summary: 'Make reasonable counter-offers, inspect thoroughly before payment, and complete the deal.', content: 'Use the "Make Offer" feature or direct chat to discuss realistic pricing with sellers. Once you agree, select a convenient public meetup spot during daylight campus hours. Test electronics thoroughly before handing over cash or bKash.', order: 2 },
    { id: 'guide-5', category: 'safety', title: 'Approved On-Campus Meetup Spots', summary: 'Recommended safe public meeting zones on campus for exchanging items.', content: 'Never meet off-campus or in secluded corners. We strictly recommend meeting at Central Library Ground Floor, Student Cafeteria, Department Corridors, or Campus Main Gate Security Area during daytime (9 AM to 5 PM).', order: 1 },
    { id: 'guide-6', category: 'safety', title: 'Avoiding Fraud & Inspecting Items First', summary: 'Strict policy: No advance payments before physical item inspection.', content: 'Do NOT send bKash or advance money before seeing and testing the product in person. UniMart is a hyper-local campus marketplace designed for face-to-face peer exchange. If anyone insists on advance delivery fees, flag or report their account immediately.', order: 2 },
    { id: 'guide-7', category: 'faq', title: 'How does university email verification work?', summary: 'Why institutional .edu.bd email addresses are required.', content: 'To keep UniMart safe and eliminate fake accounts, only users with authenticated university email addresses (e.g., student.baust.edu.bd, du.ac.bd) or faculty credentials can register and communicate.', order: 1 },
    { id: 'guide-8', category: 'faq', title: 'What should I do if an item is misrepresented?', summary: 'How to report listings and get assistance from campus admin.', content: 'You can click "Report Problem" on any listing modal or visit the Help & Support tab. Campus administrators review flagged listings daily and suspend non-compliant accounts.', order: 2 },
  ];

  for (const g of guides) {
    await prisma.guide.upsert({ where: { id: g.id }, update: {}, create: g });
  }

  const auditLogs = [
    { id: 'audit-seed-1', adminId: 'user-admin', adminName: 'Sara Khan', action: 'SYSTEM_INITIALIZATION', targetType: 'SYSTEM', targetTitle: 'UniMart Campus Core Services', details: 'Integrated BAUST, DU, BRUR, and RU campus registries and configured security roles.' },
    { id: 'audit-seed-2', adminId: 'user-admin', adminName: 'Sara Khan', action: 'USER_VERIFIED', targetType: 'USER', targetId: 'user-teacher-amin', targetTitle: 'Dr. Aminul Islam (Faculty)', details: 'Verified academic faculty credentials and official university email domain.' },
    { id: 'audit-seed-3', adminId: 'user-admin', adminName: 'Sara Khan', action: 'GUIDE_PUBLISHED', targetType: 'GUIDE', targetTitle: 'Approved On-Campus Meetup Spots', details: 'Published safety guidelines for Central Library & Student Cafeteria.' },
  ];

  for (const l of auditLogs) {
    await prisma.auditLog.upsert({ where: { id: l.id }, update: {}, create: l });
  }

  console.log('[Seed] UniMart PostgreSQL database seeded successfully.');
}

// Run standalone if invoked directly (`tsx prisma/seed.ts`)
const isDirectRun = process.argv[1]?.endsWith('seed.ts');
if (isDirectRun) {
  seedDatabase()
    .catch((err) => {
      console.error('[Seed] Failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
