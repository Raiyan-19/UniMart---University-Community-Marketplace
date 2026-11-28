import crypto from 'node:crypto';
import { prisma } from './prisma';
import {
  IUserDocument,
  IUniversityDocument,
  IDepartmentDocument,
  INotificationDocument,
  IProductDocument,
  IOfferDocument,
  ITransactionDocument,
  IReviewDocument,
  IMessageDocument,
  IConversationDocument,
  IReportDocument,
  IServiceDocument,
  IGraduationSaleDocument,
  IGuideDocument,
  IAuditLogDocument,
} from './schema';

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, generatedSalt, 64).toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(result, 'hex'));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

// Mappers from Prisma rows -> existing Document interfaces
function toUserDoc(u: any): IUserDocument {
  return {
    _id: u.id,
    name: u.name,
    email: u.email,
    passwordHash: u.passwordHash,
    salt: u.salt,
    role: u.role as IUserDocument['role'],
    universityId: u.universityId,
    departmentId: u.departmentId,
    phone: u.phone,
    avatar: u.avatar,
    bio: u.bio,
    studentId: u.studentId ?? undefined,
    designation: u.designation ?? undefined,
    currentSemester: u.currentSemester ?? undefined,
    isEmailVerified: u.isEmailVerified,
    emailVerificationToken: u.emailVerificationToken ?? undefined,
    emailVerificationExpires: u.emailVerificationExpires ? u.emailVerificationExpires.toISOString() : undefined,
    resetPasswordToken: u.resetPasswordToken ?? undefined,
    resetPasswordExpires: u.resetPasswordExpires ? u.resetPasswordExpires.toISOString() : undefined,
    isVerified: u.isVerified,
    status: u.status as IUserDocument['status'],
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

function toUniversityDoc(u: any): IUniversityDocument {
  return {
    _id: u.id,
    name: u.name,
    shortName: u.shortName,
    domain: u.domain,
    location: u.location,
    logo: u.logo,
    departmentIds: Array.isArray(u.departments) ? u.departments.map((d: any) => d.id) : [],
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

function toDepartmentDoc(d: any): IDepartmentDocument {
  return {
    _id: d.id,
    name: d.name,
    code: d.code,
    universityId: d.universityId,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

function toProductDoc(p: any): IProductDocument {
  return {
    _id: p.id,
    sellerId: p.sellerId,
    universityId: p.universityId,
    departmentId: p.departmentId,
    title: p.title,
    description: p.description,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice ?? undefined,
    condition: p.condition as IProductDocument['condition'],
    location: p.location,
    images: p.images || [],
    features: p.features || [],
    status: p.status as IProductDocument['status'],
    views: p.views,
    saves: p.saves,
    sellerType: p.sellerType as IProductDocument['sellerType'],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function toOfferDoc(o: any): IOfferDocument {
  return {
    _id: o.id,
    productId: o.productId,
    buyerId: o.buyerId,
    sellerId: o.sellerId,
    amount: o.amount,
    notes: o.notes ?? undefined,
    status: o.status as IOfferDocument['status'],
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

function toTransactionDoc(t: any): ITransactionDocument {
  return {
    _id: t.id,
    offerId: t.offerId,
    productId: t.productId,
    buyerId: t.buyerId,
    sellerId: t.sellerId,
    agreedPrice: t.agreedPrice,
    status: t.status as ITransactionDocument['status'],
    completedAt: t.completedAt.toISOString(),
  };
}

function toReviewDoc(r: any): IReviewDocument {
  return {
    _id: r.id,
    transactionId: r.transactionId ?? undefined,
    productId: r.productId ?? undefined,
    reviewerId: r.reviewerId,
    targetUserId: r.targetUserId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function toConversationDoc(c: any): IConversationDocument {
  const unread = (c.unreadCount as Record<string, number>) || {};
  return {
    _id: c.id,
    productId: c.productId,
    participantIds: c.participantIds || [],
    lastMessage: c.lastMessage ?? undefined,
    lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : undefined,
    lastMessageTimestamp: c.lastMessageAt ? c.lastMessageAt.toISOString() : undefined,
    unreadCount: unread,
    unreadCountByUser: unread,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function toMessageDoc(m: any): IMessageDocument {
  return {
    _id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    receiverId: m.receiverId,
    content: m.content,
    text: m.content,
    isOffer: m.isOffer,
    offerAmount: m.offerAmount ?? undefined,
    image: m.image ?? undefined,
    isRead: m.isRead,
    createdAt: m.createdAt.toISOString(),
  };
}

function toReportDoc(r: any): IReportDocument {
  return {
    _id: r.id,
    reporterId: r.reporterId,
    targetType: r.targetType as IReportDocument['targetType'],
    targetId: r.targetId,
    reason: r.reason,
    details: r.details ?? undefined,
    status: r.status as IReportDocument['status'],
    resolutionNotes: r.resolutionNotes ?? undefined,
    adminNotes: r.resolutionNotes ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function toServiceDoc(s: any): IServiceDocument {
  return {
    _id: s.id,
    providerId: s.providerId,
    universityId: s.universityId,
    title: s.title,
    category: s.category,
    rate: s.rate,
    location: s.location,
    rating: s.rating,
    reviewsCount: s.reviewsCount,
    description: s.description,
    status: s.status as IServiceDocument['status'],
    createdAt: s.createdAt.toISOString(),
  };
}

function toGraduationSaleDoc(g: any): IGraduationSaleDocument {
  return {
    _id: g.id,
    studentId: g.studentId,
    universityId: g.universityId,
    departmentCode: g.departmentCode,
    graduatingTerm: g.graduatingTerm,
    quote: g.quote,
    itemCount: g.itemCount,
    featuredProductIds: g.featuredProductIds || [],
    createdAt: g.createdAt.toISOString(),
  };
}

function toGuideDoc(g: any): IGuideDocument {
  return {
    _id: g.id,
    category: g.category as IGuideDocument['category'],
    title: g.title,
    summary: g.summary,
    content: g.content,
    order: g.order,
    updatedAt: g.updatedAt.toISOString(),
  };
}

function toNotificationDoc(n: any): INotificationDocument {
  return {
    _id: n.id,
    userId: n.userId,
    type: n.type as INotificationDocument['type'],
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    link: n.link ?? undefined,
    avatar: n.avatar ?? undefined,
    createdAt: n.createdAt.toISOString(),
  };
}

function toAuditLogDoc(l: any): IAuditLogDocument {
  return {
    _id: l.id,
    adminId: l.adminId,
    adminName: l.adminName,
    action: l.action,
    targetType: l.targetType,
    targetId: l.targetId ?? undefined,
    targetTitle: l.targetTitle ?? undefined,
    details: l.details ?? undefined,
    createdAt: l.createdAt.toISOString(),
  };
}

class DatabaseStore {
  // Users
  public async findUserById(id: string): Promise<IUserDocument | undefined> {
    const u = await prisma.user.findUnique({ where: { id } });
    return u ? toUserDoc(u) : undefined;
  }

  public async findUserByEmail(email: string): Promise<IUserDocument | undefined> {
    const clean = email.trim().toLowerCase();
    const u = await prisma.user.findUnique({ where: { email: clean } });
    return u ? toUserDoc(u) : undefined;
  }

  public async getAllUsers(): Promise<IUserDocument[]> {
    const list = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return list.map(toUserDoc);
  }

  public async createUser(user: IUserDocument): Promise<IUserDocument> {
    const created = await prisma.user.create({
      data: {
        id: user._id,
        name: user.name,
        email: user.email.trim().toLowerCase(),
        passwordHash: user.passwordHash,
        salt: user.salt,
        role: user.role,
        universityId: user.universityId,
        departmentId: user.departmentId,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio,
        studentId: user.studentId,
        designation: user.designation,
        currentSemester: user.currentSemester,
        isEmailVerified: user.isEmailVerified,
        emailVerificationToken: user.emailVerificationToken,
        emailVerificationExpires: user.emailVerificationExpires ? new Date(user.emailVerificationExpires) : null,
        resetPasswordToken: user.resetPasswordToken,
        resetPasswordExpires: user.resetPasswordExpires ? new Date(user.resetPasswordExpires) : null,
        isVerified: user.isVerified,
        status: user.status,
      },
    });
    return toUserDoc(created);
  }

  public async updateUser(id: string, updates: Partial<IUserDocument>): Promise<IUserDocument | undefined> {
    try {
      const data: any = { ...updates };
      delete data._id;
      delete data.createdAt;
      delete data.updatedAt;
      if ('emailVerificationToken' in updates && updates.emailVerificationToken === undefined) {
        data.emailVerificationToken = null;
      }
      if ('emailVerificationExpires' in updates) {
        data.emailVerificationExpires = updates.emailVerificationExpires
          ? new Date(updates.emailVerificationExpires)
          : null;
      }
      if ('resetPasswordToken' in updates && updates.resetPasswordToken === undefined) {
        data.resetPasswordToken = null;
      }
      if ('resetPasswordExpires' in updates) {
        data.resetPasswordExpires = updates.resetPasswordExpires
          ? new Date(updates.resetPasswordExpires)
          : null;
      }

      const updated = await prisma.user.update({ where: { id }, data });
      return toUserDoc(updated);
    } catch {
      return undefined;
    }
  }

  // Universities & Departments
  public async getAllUniversities(): Promise<IUniversityDocument[]> {
    const list = await prisma.university.findMany({
      include: { departments: { select: { id: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return list.map(toUniversityDoc);
  }

  public async findUniversityById(id: string): Promise<IUniversityDocument | undefined> {
    const u = await prisma.university.findUnique({
      where: { id },
      include: { departments: { select: { id: true } } },
    });
    return u ? toUniversityDoc(u) : undefined;
  }

  public async createUniversity(univ: IUniversityDocument): Promise<IUniversityDocument> {
    const created = await prisma.university.create({
      data: {
        id: univ._id,
        name: univ.name,
        shortName: univ.shortName,
        domain: univ.domain,
        location: univ.location,
        logo: univ.logo,
      },
      include: { departments: { select: { id: true } } },
    });
    return toUniversityDoc(created);
  }

  public async updateUniversity(id: string, updates: Partial<IUniversityDocument>): Promise<IUniversityDocument | undefined> {
    try {
      const data: any = { ...updates };
      delete data._id;
      delete data.departmentIds;
      delete data.createdAt;
      delete data.updatedAt;
      const updated = await prisma.university.update({
        where: { id },
        data,
        include: { departments: { select: { id: true } } },
      });
      return toUniversityDoc(updated);
    } catch {
      return undefined;
    }
  }

  public async deleteUniversity(id: string): Promise<boolean> {
    try {
      await prisma.university.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  public async getAllDepartments(): Promise<IDepartmentDocument[]> {
    const list = await prisma.department.findMany({ orderBy: { code: 'asc' } });
    return list.map(toDepartmentDoc);
  }

  public async getDepartmentsByUniversity(universityId: string): Promise<IDepartmentDocument[]> {
    const list = await prisma.department.findMany({
      where: { universityId },
      orderBy: { code: 'asc' },
    });
    return list.map(toDepartmentDoc);
  }

  public async findDepartmentById(id: string): Promise<IDepartmentDocument | undefined> {
    const d = await prisma.department.findUnique({ where: { id } });
    return d ? toDepartmentDoc(d) : undefined;
  }

  public async createDepartment(dept: IDepartmentDocument): Promise<IDepartmentDocument> {
    const created = await prisma.department.create({
      data: {
        id: dept._id,
        name: dept.name,
        code: dept.code,
        universityId: dept.universityId,
      },
    });
    return toDepartmentDoc(created);
  }

  public async updateDepartment(id: string, updates: Partial<IDepartmentDocument>): Promise<IDepartmentDocument | undefined> {
    try {
      const data: any = { ...updates };
      delete data._id;
      delete data.createdAt;
      delete data.updatedAt;
      const updated = await prisma.department.update({ where: { id }, data });
      return toDepartmentDoc(updated);
    } catch {
      return undefined;
    }
  }

  public async deleteDepartment(id: string): Promise<boolean> {
    try {
      await prisma.department.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // Products
  public async getAllProducts(): Promise<IProductDocument[]> {
    const list = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    return list.map(toProductDoc);
  }

  public async findProductById(id: string): Promise<IProductDocument | undefined> {
    const p = await prisma.product.findUnique({ where: { id } });
    return p ? toProductDoc(p) : undefined;
  }

  public async incrementProductViews(id: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  public async createProduct(product: IProductDocument): Promise<IProductDocument> {
    const created = await prisma.product.create({
      data: {
        id: product._id,
        sellerId: product.sellerId,
        universityId: product.universityId,
        departmentId: product.departmentId,
        title: product.title,
        description: product.description,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice ?? null,
        condition: product.condition,
        location: product.location,
        images: product.images || [],
        features: product.features || [],
        status: product.status,
        views: product.views || 0,
        saves: product.saves || 0,
        sellerType: product.sellerType,
      },
    });
    return toProductDoc(created);
  }

  public async updateProduct(id: string, updates: Partial<IProductDocument>): Promise<IProductDocument | undefined> {
    try {
      const data: any = { ...updates };
      delete data._id;
      delete data.createdAt;
      delete data.updatedAt;
      const updated = await prisma.product.update({ where: { id }, data });
      return toProductDoc(updated);
    } catch {
      return undefined;
    }
  }

  public async deleteProduct(id: string): Promise<boolean> {
    try {
      await prisma.product.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // Wishlist
  public async getUserWishlist(userId: string): Promise<string[]> {
    const rows = await prisma.wishlist.findMany({
      where: { userId },
      select: { productId: true },
    });
    return rows.map((r) => r.productId);
  }

  public async toggleWishlist(userId: string, productId: string): Promise<{ isSaved: boolean; count: number; saves: number }> {
    if (!productId) {
      throw new Error('Product ID is required');
    }
    return prisma.$transaction(async (tx) => {
      const existing = await tx.wishlist.findUnique({
        where: { userId_productId: { userId, productId } },
      });
      const prod = await tx.product.findUnique({ where: { id: productId } });
      if (!prod) {
        throw new Error('Product not found');
      }

      let isSaved = false;
      let updatedSaves = prod.saves;
      if (existing) {
        await tx.wishlist.delete({ where: { id: existing.id } });
        const updated = await tx.product.update({
          where: { id: productId },
          data: { saves: Math.max(0, prod.saves - 1) },
        });
        updatedSaves = updated.saves;
        isSaved = false;
      } else {
        await tx.wishlist.create({ data: { userId, productId } });
        const updated = await tx.product.update({
          where: { id: productId },
          data: { saves: { increment: 1 } },
        });
        updatedSaves = updated.saves;
        if (prod.sellerId !== userId) {
          await tx.notification.create({
            data: {
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              userId: prod.sellerId,
              type: 'wishlist',
              title: 'Someone saved your listing!',
              message: `Your item "${prod.title}" has been saved by another student.`,
              isRead: false,
              link: `/product/${prod.id}`,
            },
          });
        }
        isSaved = true;
      }

      const count = await tx.wishlist.count({ where: { userId } });
      return { isSaved, count, saves: updatedSaves };
    });
  }

  // Offers & Transactions
  public async getAllOffers(): Promise<IOfferDocument[]> {
    const list = await prisma.offer.findMany({ orderBy: { createdAt: 'desc' } });
    return list.map(toOfferDoc);
  }

  public async createOffer(offer: IOfferDocument): Promise<IOfferDocument> {
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.offer.create({
        data: {
          id: offer._id,
          productId: offer.productId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          amount: offer.amount,
          notes: offer.notes ?? offer.message ?? null,
          status: offer.status,
        },
      });
      const prod = await tx.product.findUnique({ where: { id: offer.productId } });
      const buyer = await tx.user.findUnique({ where: { id: offer.buyerId } });

      await tx.notification.create({
        data: {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: offer.sellerId,
          type: 'offer',
          title: `New Offer Received: ৳ ${offer.amount.toLocaleString()}`,
          message: `${buyer?.name || 'A buyer'} made an offer of ৳ ${offer.amount.toLocaleString()} for "${prod?.title || 'your item'}".`,
          isRead: false,
        },
      });
      return row;
    });
    return toOfferDoc(created);
  }

  public async updateOfferStatus(offerId: string, status: IOfferDocument['status']): Promise<IOfferDocument | undefined> {
    const existing = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!existing) return undefined;

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.offer.update({
        where: { id: offerId },
        data: { status },
      });

      const prod = await tx.product.findUnique({ where: { id: row.productId } });

      if (status === 'ACCEPTED') {
        if (prod) {
          await tx.product.update({ where: { id: prod.id }, data: { status: 'sold' } });
        }
        await tx.transaction.upsert({
          where: { offerId: row.id },
          update: { agreedPrice: row.amount, status: 'COMPLETED' },
          create: {
            id: `trans-${Date.now()}`,
            offerId: row.id,
            productId: row.productId,
            buyerId: row.buyerId,
            sellerId: row.sellerId,
            agreedPrice: row.amount,
            status: 'COMPLETED',
          },
        });
        await tx.notification.create({
          data: {
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userId: row.buyerId,
            type: 'offer',
            title: 'Offer Accepted! 🎉',
            message: `Your offer of ৳ ${row.amount.toLocaleString()} for "${prod?.title || 'the item'}" has been accepted! You can now complete the transaction.`,
            isRead: false,
          },
        });
      } else if (status === 'REJECTED') {
        await tx.notification.create({
          data: {
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userId: row.buyerId,
            type: 'offer',
            title: 'Offer Declined',
            message: `Your offer for "${prod?.title || 'the item'}" was declined by the seller.`,
            isRead: false,
          },
        });
      }

      return row;
    });

    return toOfferDoc(updated);
  }

  public async getTransactions(): Promise<ITransactionDocument[]> {
    const list = await prisma.transaction.findMany({ orderBy: { completedAt: 'desc' } });
    return list.map(toTransactionDoc);
  }

  // Reviews
  public async getReviews(): Promise<IReviewDocument[]> {
    const list = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
    return list.map(toReviewDoc);
  }

  public async createReview(review: IReviewDocument): Promise<IReviewDocument> {
    const created = await prisma.review.create({
      data: {
        id: review._id,
        transactionId: review.transactionId ?? null,
        productId: review.productId ?? null,
        reviewerId: review.reviewerId,
        targetUserId: review.targetUserId || review.sellerId || '',
        rating: review.rating,
        comment: review.comment,
      },
    });
    return toReviewDoc(created);
  }

  // Chat Conversations & Messages
  public async getConversationsForUser(userId: string): Promise<IConversationDocument[]> {
    const valid = await prisma.conversation.findMany({
      where: { participantIds: { has: userId } },
      orderBy: { updatedAt: 'desc' },
    });
    const seen = new Set<string>();
    return valid
      .filter((c) => !c.id.startsWith('conv-test-') && !c.id.startsWith('conv-sec-test-'))
      .filter((c) => {
        const otherId = c.participantIds.find((id) => id !== userId) || '';
        const key = `${c.productId}_${otherId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(toConversationDoc);
  }

  public async findConversation(productId: string, buyerId: string, sellerId: string): Promise<IConversationDocument | undefined> {
    const list = await prisma.conversation.findMany({
      where: {
        productId,
        participantIds: { hasEvery: [buyerId, sellerId] },
      },
    });
    return list[0] ? toConversationDoc(list[0]) : undefined;
  }

  public async createConversation(conv: IConversationDocument): Promise<IConversationDocument> {
    const created = await prisma.conversation.create({
      data: {
        id: conv._id,
        productId: conv.productId,
        participantIds: conv.participantIds,
        lastMessage: conv.lastMessage ?? null,
        lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : new Date(),
        unreadCount: (conv.unreadCountByUser || conv.unreadCount || {}) as any,
      },
    });
    return toConversationDoc(created);
  }

  public async getMessages(conversationId: string): Promise<IMessageDocument[]> {
    const list = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
    return list.map(toMessageDoc);
  }

  public async createMessage(msg: IMessageDocument): Promise<IMessageDocument> {
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.message.create({
        data: {
          id: msg._id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          content: msg.content || msg.text || '',
          isOffer: !!msg.isOffer,
          offerAmount: msg.offerAmount ?? null,
          image: msg.image ?? null,
          isRead: !!msg.isRead,
        },
      });

      const conv = await tx.conversation.findUnique({ where: { id: msg.conversationId } });
      if (conv) {
        const unread = { ...((conv.unreadCount as Record<string, number>) || {}) };
        unread[msg.receiverId] = (unread[msg.receiverId] || 0) + 1;
        await tx.conversation.update({
          where: { id: conv.id },
          data: {
            lastMessage: msg.content || msg.text || '',
            lastMessageAt: row.createdAt,
            unreadCount: unread,
          },
        });
      }

      const sender = await tx.user.findUnique({ where: { id: msg.senderId } });
      await tx.notification.create({
        data: {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: msg.receiverId,
          type: 'message',
          title: `New message from ${sender?.name || 'Peer'}`,
          message: msg.content || msg.text || 'You received a new campus message',
          isRead: false,
        },
      });

      return row;
    });
    return toMessageDoc(created);
  }

  public async getConversationById(id: string): Promise<IConversationDocument | undefined> {
    const c = await prisma.conversation.findUnique({ where: { id } });
    return c ? toConversationDoc(c) : undefined;
  }

  public async markConversationRead(conversationId: string, userId: string): Promise<void> {
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) return;
    const unread = { ...((conv.unreadCount as Record<string, number>) || {}) };
    unread[userId] = 0;
    await prisma.$transaction([
      prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCount: unread },
      }),
      prisma.message.updateMany({
        where: { conversationId, receiverId: userId, isRead: false },
        data: { isRead: true },
      }),
    ]);
  }

  // Reports
  public async getAllReports(): Promise<IReportDocument[]> {
    const list = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
    return list.map(toReportDoc);
  }

  public async getReports(): Promise<IReportDocument[]> {
    return this.getAllReports();
  }

  public async createReport(report: IReportDocument): Promise<IReportDocument> {
    const created = await prisma.report.create({
      data: {
        id: report._id,
        reporterId: report.reporterId,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        details: report.details ?? report.description ?? '',
        status: report.status,
      },
    });
    return toReportDoc(created);
  }

  public async updateReportStatus(
    reportId: string,
    status: IReportDocument['status'],
    adminNotes?: string
  ): Promise<IReportDocument | undefined> {
    try {
      const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
          status,
          ...(adminNotes !== undefined ? { resolutionNotes: adminNotes } : {}),
        },
      });
      return toReportDoc(updated);
    } catch {
      return undefined;
    }
  }

  // Services
  public async getAllServices(): Promise<IServiceDocument[]> {
    const list = await prisma.campusService.findMany({ orderBy: { createdAt: 'desc' } });
    return list.map(toServiceDoc);
  }

  public async getServiceCategories(): Promise<string[]> {
    const list = await prisma.serviceCategory.findMany({ orderBy: { createdAt: 'asc' } });
    if (list.length === 0) {
      return ['PC & Software', 'Academic Help', 'Design & Creative', 'Tutoring'];
    }
    return list.map((c) => c.name);
  }

  public async addServiceCategory(category: string): Promise<string[]> {
    const clean = category.trim();
    if (clean) {
      const existing = await prisma.serviceCategory.findFirst({
        where: { name: { equals: clean, mode: 'insensitive' } },
      });
      if (!existing) {
        await prisma.serviceCategory.create({ data: { name: clean } });
      }
    }
    return this.getServiceCategories();
  }

  public async deleteServiceCategory(category: string): Promise<string[]> {
    const clean = category.trim();
    await prisma.serviceCategory.deleteMany({
      where: { name: { equals: clean, mode: 'insensitive' } },
    });
    return this.getServiceCategories();
  }

  public async createService(service: IServiceDocument): Promise<IServiceDocument> {
    const created = await prisma.campusService.create({
      data: {
        id: service._id,
        providerId: service.providerId,
        universityId: service.universityId,
        title: service.title,
        category: service.category,
        rate: service.rate,
        location: service.location,
        rating: service.rating,
        reviewsCount: service.reviewsCount,
        description: service.description,
        status: service.status,
      },
    });
    return toServiceDoc(created);
  }

  // Graduation Sales
  public async getAllGraduationSales(): Promise<IGraduationSaleDocument[]> {
    const list = await prisma.graduationSale.findMany({ orderBy: { createdAt: 'desc' } });
    return list.map(toGraduationSaleDoc);
  }

  public async findGraduationSaleById(id: string): Promise<IGraduationSaleDocument | undefined> {
    const gs = await prisma.graduationSale.findUnique({ where: { id } });
    return gs ? toGraduationSaleDoc(gs) : undefined;
  }

  public async createGraduationSale(sale: IGraduationSaleDocument): Promise<IGraduationSaleDocument> {
    const created = await prisma.graduationSale.create({
      data: {
        id: sale._id,
        studentId: sale.studentId,
        universityId: sale.universityId,
        departmentCode: sale.departmentCode,
        graduatingTerm: sale.graduatingTerm,
        quote: sale.quote,
        itemCount: sale.itemCount,
        featuredProductIds: sale.featuredProductIds || [],
      },
    });
    return toGraduationSaleDoc(created);
  }

  public async updateGraduationSale(
    id: string,
    updates: Partial<IGraduationSaleDocument>
  ): Promise<IGraduationSaleDocument | null> {
    try {
      const data: any = { ...updates };
      delete data._id;
      delete data.createdAt;
      const updated = await prisma.graduationSale.update({ where: { id }, data });
      return toGraduationSaleDoc(updated);
    } catch {
      return null;
    }
  }

  public async deleteGraduationSale(id: string): Promise<boolean> {
    try {
      await prisma.graduationSale.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // Guides Management
  public async getAllGuides(): Promise<IGuideDocument[]> {
    const list = await prisma.guide.findMany({ orderBy: { order: 'asc' } });
    return list.map(toGuideDoc);
  }

  public async createGuide(guide: IGuideDocument): Promise<IGuideDocument> {
    const created = await prisma.guide.create({
      data: {
        id: guide._id,
        category: guide.category,
        title: guide.title,
        summary: guide.summary,
        content: guide.content,
        order: guide.order || 0,
      },
    });
    return toGuideDoc(created);
  }

  public async updateGuide(id: string, updates: Partial<IGuideDocument>): Promise<IGuideDocument | undefined> {
    try {
      const data: any = { ...updates };
      delete data._id;
      delete data.updatedAt;
      const updated = await prisma.guide.update({ where: { id }, data });
      return toGuideDoc(updated);
    } catch {
      return undefined;
    }
  }

  public async deleteGuide(id: string): Promise<boolean> {
    try {
      await prisma.guide.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  // Notifications
  public async getNotificationsByUser(userId: string): Promise<INotificationDocument[]> {
    const list = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(toNotificationDoc);
  }

  public async createNotification(notif: INotificationDocument): Promise<INotificationDocument> {
    const created = await prisma.notification.create({
      data: {
        id: notif._id,
        userId: notif.userId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        isRead: notif.isRead,
        link: notif.link ?? null,
        avatar: notif.avatar ?? null,
      },
    });
    return toNotificationDoc(created);
  }

  public async markNotificationAsRead(id: string, userId: string): Promise<boolean> {
    const res = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return res.count > 0;
  }

  public async markAllNotificationsAsRead(userId: string): Promise<number> {
    const res = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return res.count;
  }

  // Audit Logs
  public async getAuditLogs(): Promise<IAuditLogDocument[]> {
    const list = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 250,
    });
    return list.map(toAuditLogDoc);
  }

  public async createAuditLog(log: IAuditLogDocument): Promise<IAuditLogDocument> {
    const created = await prisma.auditLog.create({
      data: {
        id: log._id,
        adminId: log.adminId,
        adminName: log.adminName,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId ?? null,
        targetTitle: log.targetTitle ?? null,
        details: log.details ?? null,
      },
    });
    return toAuditLogDoc(created);
  }
}

export const db = new DatabaseStore();
