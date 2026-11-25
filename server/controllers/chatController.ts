import { Request, Response } from 'express';
import { db } from '../db/store';
import { IConversationDocument } from '../db/schema';
import { Conversation, ChatMessage } from '../../src/types';

async function formatConversation(doc: IConversationDocument, currentUserId: string): Promise<Conversation> {
  const otherUserId = doc.participantIds.find((id) => id !== currentUserId) || doc.participantIds[0];
  const [otherUser, prod] = await Promise.all([
    otherUserId ? db.findUserById(otherUserId) : Promise.resolve(undefined),
    db.findProductById(doc.productId),
  ]);
  const otherUniv = otherUser?.universityId ? await db.findUniversityById(otherUser.universityId) : undefined;

  return {
    id: doc._id,
    productId: doc.productId,
    productTitle: prod?.title || 'Campus Listing',
    productPrice: prod?.price || 0,
    productImage: prod?.images?.[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80',
    participantIds: doc.participantIds,
    otherUserName: otherUser?.name || 'Fellow Student',
    otherUserAvatar: otherUser?.avatar,
    otherUserRole: otherUser?.role || 'student',
    otherUserUniversity: otherUniv?.shortName || 'BAUST',
    lastMessage: doc.lastMessage,
    lastMessageAt: doc.lastMessageAt || doc.lastMessageTimestamp || doc.updatedAt,
    unreadCount: (doc.unreadCount?.[currentUserId] ?? doc.unreadCountByUser?.[currentUserId]) || 0,
  };
}

export async function getConversations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const convs = await db.getConversationsForUser(userId);
    const formatted = await Promise.all(convs.map((c) => formatConversation(c, userId)));
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch conversations.' });
  }
}

export async function getConversationMessages(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const conv = await db.getConversationById(id);
    if (!conv || !conv.participantIds.includes(userId)) {
      res.status(404).json({ success: false, error: 'Conversation not found.' });
      return;
    }

    await db.markConversationRead(id, userId);

    const rawMsgs = await db.getMessages(id);
    const msgs = rawMsgs.map((m) => ({
      id: m._id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      receiverId: m.receiverId,
      text: m.text || m.content || '',
      content: m.content || m.text || '',
      isOffer: m.isOffer,
      offerAmount: m.offerAmount,
      isRead: m.isRead,
      createdAt: m.createdAt,
    } as ChatMessage));

    res.json({
      success: true,
      data: msgs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
  }
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const senderId = req.user?._id;
    const { id } = req.params;
    const { text } = req.body;

    if (!senderId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!text || !text.trim()) {
      res.status(400).json({ success: false, error: 'Message cannot be empty.' });
      return;
    }

    const conv = await db.getConversationById(id);
    if (!conv || !conv.participantIds.includes(senderId)) {
      res.status(404).json({ success: false, error: 'Conversation not found.' });
      return;
    }

    const receiverId = conv.participantIds.find((pid) => pid !== senderId) || '';

    const newMsg = await db.createMessage({
      _id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversationId: id,
      senderId,
      receiverId,
      content: text.trim(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      data: {
        id: newMsg._id,
        conversationId: newMsg.conversationId,
        senderId: newMsg.senderId,
        receiverId: newMsg.receiverId,
        text: newMsg.text || newMsg.content || '',
        content: newMsg.content || newMsg.text || '',
        isOffer: newMsg.isOffer,
        offerAmount: newMsg.offerAmount,
        isRead: newMsg.isRead,
        createdAt: newMsg.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
}

export async function startConversationForProduct(req: Request, res: Response): Promise<void> {
  try {
    const buyerId = req.user?._id;
    const { productId, initialMessage } = req.body;

    if (!buyerId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const prod = await db.findProductById(productId);
    if (!prod) {
      res.status(404).json({ success: false, error: 'Product not found.' });
      return;
    }

    if (prod.sellerId === buyerId) {
      res.status(400).json({ success: false, error: 'You cannot chat with yourself on your own listing.' });
      return;
    }

    let conv = await db.findConversation(productId, buyerId, prod.sellerId);
    if (!conv) {
      conv = await db.createConversation({
        _id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId,
        participantIds: [buyerId, prod.sellerId],
        lastMessage: initialMessage || 'Started a conversation about this listing.',
        lastMessageTimestamp: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        unreadCountByUser: {
          [prod.sellerId]: initialMessage && initialMessage.trim() ? 0 : 1,
          [buyerId]: 0,
        },
        unreadCount: {
          [prod.sellerId]: initialMessage && initialMessage.trim() ? 0 : 1,
          [buyerId]: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (initialMessage && initialMessage.trim()) {
      await db.createMessage({
        _id: `msg-${Date.now()}`,
        conversationId: conv._id,
        senderId: buyerId,
        receiverId: prod.sellerId,
        content: initialMessage.trim(),
        text: initialMessage.trim(),
        createdAt: new Date().toISOString(),
      });
      conv = (await db.getConversationById(conv._id)) || conv;
    }

    res.json({
      success: true,
      data: await formatConversation(conv, buyerId),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to start conversation.' });
  }
}
