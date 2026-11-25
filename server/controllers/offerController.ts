import { Request, Response } from 'express';
import { db } from '../db/store';
import { IOfferDocument } from '../db/schema';
import { Offer } from '../../src/types';

async function formatOffer(doc: IOfferDocument): Promise<Offer> {
  const [buyer, seller, prod] = await Promise.all([
    db.findUserById(doc.buyerId),
    db.findUserById(doc.sellerId),
    db.findProductById(doc.productId),
  ]);

  return {
    id: doc._id,
    productId: doc.productId,
    productTitle: prod?.title || 'Campus Item',
    productPrice: prod?.price || 0,
    productImage: prod?.images?.[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80',
    buyerId: doc.buyerId,
    buyerName: buyer?.name || 'Buyer',
    buyerAvatar: buyer?.avatar,
    sellerId: doc.sellerId,
    sellerName: seller?.name || 'Seller',
    amount: doc.amount,
    notes: doc.notes,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function getUserOffers(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const roleFilter = req.query.type;
    let offers = await db.getAllOffers();

    if (roleFilter === 'sent') {
      offers = offers.filter((o) => o.buyerId === userId);
    } else if (roleFilter === 'received') {
      offers = offers.filter((o) => o.sellerId === userId);
    } else {
      offers = offers.filter((o) => o.buyerId === userId || o.sellerId === userId);
    }

    const formatted = await Promise.all(offers.map(formatOffer));
    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve offers.' });
  }
}

export async function createOffer(req: Request, res: Response): Promise<void> {
  try {
    const buyerId = req.user?._id;
    if (!buyerId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { productId, amount, notes } = req.body;
    if (!productId || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ success: false, error: 'Product ID and valid offer amount required.' });
      return;
    }

    const prod = await db.findProductById(productId);
    if (!prod) {
      res.status(404).json({ success: false, error: 'Product listing not found.' });
      return;
    }

    if (prod.sellerId === buyerId) {
      res.status(400).json({ success: false, error: 'You cannot make an offer on your own listing.' });
      return;
    }

    if (prod.status === 'sold') {
      res.status(400).json({ success: false, error: 'This item has already been marked as sold.' });
      return;
    }

    const newOffer: IOfferDocument = {
      _id: `offer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId,
      buyerId,
      sellerId: prod.sellerId,
      amount,
      notes: notes || undefined,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await db.createOffer(newOffer);

    let conv = await db.findConversation(productId, buyerId, prod.sellerId);
    if (!conv) {
      conv = await db.createConversation({
        _id: `conv-${Date.now()}`,
        productId,
        participantIds: [buyerId, prod.sellerId],
        lastMessage: `Submitted an offer of ৳ ${amount.toLocaleString()}`,
        lastMessageTimestamp: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        unreadCountByUser: {
          [prod.sellerId]: 0,
          [buyerId]: 0,
        },
        unreadCount: {
          [prod.sellerId]: 0,
          [buyerId]: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await db.createMessage({
      _id: `msg-${Date.now()}`,
      conversationId: conv._id,
      senderId: buyerId,
      receiverId: prod.sellerId,
      content: `Made an official offer of ৳ ${amount.toLocaleString()}${notes ? ` ("${notes}")` : ''}`,
      text: `Made an official offer of ৳ ${amount.toLocaleString()}${notes ? ` ("${notes}")` : ''}`,
      isOffer: true,
      offerAmount: amount,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      data: await formatOffer(created),
      message: `Offer of ৳ ${amount.toLocaleString()} submitted successfully!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create offer.' });
  }
}

export async function acceptOffer(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const offers = await db.getAllOffers();
    const offer = offers.find((o) => o._id === id);
    if (!offer) {
      res.status(404).json({ success: false, error: 'Offer not found.' });
      return;
    }

    if (offer.sellerId !== userId) {
      res.status(403).json({ success: false, error: 'Only the seller can accept this offer.' });
      return;
    }

    const updated = await db.updateOfferStatus(id, 'ACCEPTED');
    if (!updated) {
      res.status(500).json({ success: false, error: 'Failed to update offer.' });
      return;
    }

    res.json({
      success: true,
      data: await formatOffer(updated),
      message: 'Offer accepted! The item is now marked as sold.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to accept offer.' });
  }
}

export async function rejectOffer(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const offers = await db.getAllOffers();
    const offer = offers.find((o) => o._id === id);
    if (!offer) {
      res.status(404).json({ success: false, error: 'Offer not found.' });
      return;
    }

    if (offer.sellerId !== userId) {
      res.status(403).json({ success: false, error: 'Only the seller can reject this offer.' });
      return;
    }

    const updated = await db.updateOfferStatus(id, 'REJECTED');
    res.json({
      success: true,
      data: updated ? await formatOffer(updated) : null,
      message: 'Offer has been declined.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reject offer.' });
  }
}

export async function cancelOffer(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const offers = await db.getAllOffers();
    const offer = offers.find((o) => o._id === id);
    if (!offer) {
      res.status(404).json({ success: false, error: 'Offer not found.' });
      return;
    }

    if (offer.buyerId !== userId) {
      res.status(403).json({ success: false, error: 'Only the buyer can cancel this offer.' });
      return;
    }

    const updated = await db.updateOfferStatus(id, 'CANCELLED');
    res.json({
      success: true,
      data: updated ? await formatOffer(updated) : null,
      message: 'Offer cancelled.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel offer.' });
  }
}
