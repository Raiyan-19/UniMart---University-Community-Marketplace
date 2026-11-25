import { Request, Response } from 'express';
import { db } from '../db/store';
import { IProductDocument, IServiceDocument, IGuideDocument, IGraduationSaleDocument } from '../db/schema';
import { Product, ProductCondition } from '../../src/types';

async function formatProductsBatch(docs: IProductDocument[], currentUserId?: string): Promise<Product[]> {
  if (docs.length === 0) return [];
  const [users, universities, departments, wishlistIds] = await Promise.all([
    db.getAllUsers(),
    db.getAllUniversities(),
    db.getAllDepartments(),
    currentUserId ? db.getUserWishlist(currentUserId) : Promise.resolve<string[]>([]),
  ]);

  const userMap = new Map(users.map((u) => [u._id, u]));
  const univMap = new Map(universities.map((u) => [u._id, u]));
  const deptMap = new Map(departments.map((d) => [d._id, d]));
  const wishlistSet = new Set(wishlistIds);

  return docs.map((doc) => {
    const seller = userMap.get(doc.sellerId);
    const univ = univMap.get(doc.universityId);
    const dept = deptMap.get(doc.departmentId);

    return {
      id: doc._id,
      sellerId: doc.sellerId,
      sellerName: seller?.name || 'Campus Peer',
      sellerAvatar: seller?.avatar,
      sellerRole: seller?.role,
      sellerIsVerified: seller?.isVerified,
      sellerPhone: seller?.phone,
      universityId: doc.universityId,
      universityShortName: univ?.shortName || 'BAUST',
      departmentId: doc.departmentId,
      departmentName: dept?.name,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      price: doc.price,
      originalPrice: doc.originalPrice,
      condition: doc.condition,
      location: doc.location,
      images: doc.images,
      features: doc.features,
      status: doc.status,
      views: doc.views,
      saves: doc.saves,
      sellerType: doc.sellerType,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      isSaved: wishlistSet.has(doc._id),
    };
  });
}

export async function formatProduct(doc: IProductDocument, currentUserId?: string): Promise<Product> {
  const [formatted] = await formatProductsBatch([doc], currentUserId);
  return formatted;
}

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      category,
      universityId,
      departmentId,
      condition,
      minPrice,
      maxPrice,
      sellerType,
      status,
      sort,
    } = req.query;

    const currentUserId = req.user?._id;
    let list = await db.getAllProducts();

    if (status && status !== 'all') {
      list = list.filter((p) => p.status === status);
    } else if (!status) {
      list = list.filter((p) => p.status === 'active');
    }

    if (search) {
      const q = (search as string).toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'all' && category !== 'All') {
      list = list.filter((p) => p.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (universityId && universityId !== 'all') {
      list = list.filter((p) => p.universityId === universityId);
    }

    if (departmentId && departmentId !== 'all') {
      list = list.filter((p) => p.departmentId === departmentId);
    }

    if (condition && condition !== 'all') {
      list = list.filter((p) => p.condition === condition);
    }

    if (sellerType && sellerType !== 'all') {
      list = list.filter((p) => p.sellerType === sellerType);
    }

    if (minPrice) {
      const min = parseFloat(minPrice as string);
      if (!isNaN(min)) list = list.filter((p) => p.price >= min);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice as string);
      if (!isNaN(max)) list = list.filter((p) => p.price <= max);
    }

    if (sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'popular') {
      list.sort((a, b) => b.views - a.views);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const formatted = await formatProductsBatch(list, currentUserId);
    res.json({
      success: true,
      data: formatted,
      total: formatted.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch products.' });
  }
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await db.findProductById(id);
    if (!doc) {
      res.status(404).json({ success: false, error: 'Product listing not found.' });
      return;
    }

    await db.incrementProductViews(id);
    const updatedDoc = { ...doc, views: (doc.views || 0) + 1 };

    const allProducts = await db.getAllProducts();
    const similarDocs = allProducts
      .filter((p) => p._id !== id && p.status === 'active' && (p.category === doc.category || p.universityId === doc.universityId))
      .slice(0, 5);

    const [formatted, similar] = await Promise.all([
      formatProduct(updatedDoc, req.user?._id),
      formatProductsBatch(similarDocs, req.user?._id),
    ]);

    res.json({
      success: true,
      data: {
        ...formatted,
        similar,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load product.' });
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Must be logged in to create a listing.' });
      return;
    }

    const {
      title,
      description,
      category,
      price,
      originalPrice,
      condition,
      location,
      images,
      features,
    } = req.body;

    if (!title || !description || !category || price === undefined) {
      res.status(400).json({ success: false, error: 'Title, description, category, and price are required.' });
      return;
    }

    const defaultImages = [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80',
    ];

    const newProd: IProductDocument = {
      _id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sellerId: req.user._id,
      universityId: req.user.universityId,
      departmentId: req.user.departmentId,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      price: Math.max(0, parseFloat(price)),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      condition: (condition as ProductCondition) || 'Good Condition',
      location: location || `${req.user.universityId} Campus`,
      images: Array.isArray(images) && images.length > 0 ? images : defaultImages,
      features: Array.isArray(features) ? features : [],
      status: 'active',
      views: 0,
      saves: 0,
      sellerType: req.user.role === 'teacher' ? 'teacher' : 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await db.createProduct(newProd);

    await db.createNotification({
      _id: `notif-${Date.now()}`,
      userId: req.user._id,
      type: 'listing_approved',
      title: 'Listing Published! 🚀',
      message: `Your listing "${created.title}" is now live on UniMart.`,
      isRead: false,
      link: `/product/${created._id}`,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Product listing created successfully.',
      data: await formatProduct(created, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create listing.' });
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await db.findProductById(id);
    if (!doc) {
      res.status(404).json({ success: false, error: 'Listing not found.' });
      return;
    }

    if (doc.sellerId !== req.user?._id && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, error: 'You are not authorized to edit this listing.' });
      return;
    }

    const {
      title,
      description,
      category,
      price,
      originalPrice,
      condition,
      location,
      images,
      features,
      status,
    } = req.body;

    const updated = await db.updateProduct(id, {
      ...(title ? { title: title.trim() } : {}),
      ...(description ? { description: description.trim() } : {}),
      ...(category ? { category } : {}),
      ...(price !== undefined ? { price: parseFloat(price) } : {}),
      ...(originalPrice !== undefined ? { originalPrice: parseFloat(originalPrice) } : {}),
      ...(condition ? { condition } : {}),
      ...(location ? { location } : {}),
      ...(images ? { images } : {}),
      ...(features ? { features } : {}),
      ...(status ? { status } : {}),
    });

    res.json({
      success: true,
      message: 'Listing updated.',
      data: updated ? await formatProduct(updated, req.user?._id) : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update listing.' });
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await db.findProductById(id);
    if (!doc) {
      res.status(404).json({ success: false, error: 'Listing not found.' });
      return;
    }

    if (doc.sellerId !== req.user?._id && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Not authorized to delete this listing.' });
      return;
    }

    if (req.user?.role === 'admin') {
      await db.createAuditLog({
        _id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        adminId: req.user._id,
        adminName: req.user.name,
        action: 'LISTING_DELETED',
        targetType: 'LISTING',
        targetId: id,
        targetTitle: doc.title,
        details: `Listing permanently purged by administrator.`,
        createdAt: new Date().toISOString(),
      });
    }

    await db.deleteProduct(id);
    res.json({ success: true, message: 'Listing deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete listing.' });
  }
}

export async function getAllAdminListings(req: Request, res: Response): Promise<void> {
  try {
    const { search, status, universityId, category } = req.query;
    let list = await db.getAllProducts();

    if (status && status !== 'all') {
      list = list.filter((p) => p.status === status);
    }

    if (search) {
      const q = (search as string).toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (universityId && universityId !== 'all') {
      list = list.filter((p) => p.universityId === universityId);
    }

    if (category && category !== 'all') {
      list = list.filter((p) => p.category.toLowerCase() === (category as string).toLowerCase());
    }

    const formatted = await formatProductsBatch(list, req.user?._id);
    res.json({
      success: true,
      data: formatted,
      total: formatted.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch admin listings.' });
  }
}

export async function updateListingModerationStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const doc = await db.findProductById(id);
    if (!doc) {
      res.status(404).json({ success: false, error: 'Listing not found.' });
      return;
    }

    const updated = await db.updateProduct(id, {
      status: status || 'active',
    });

    await db.createAuditLog({
      _id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      adminId: req.user?._id || 'admin',
      adminName: req.user?.name || 'Administrator',
      action: status === 'suspended' ? 'LISTING_SUSPENDED' : 'LISTING_STATUS_CHANGED',
      targetType: 'LISTING',
      targetId: id,
      targetTitle: doc.title,
      details: reason ? `Reason: ${reason}` : `Listing moderation status changed to ${(status || 'active').toUpperCase()}.`,
      createdAt: new Date().toISOString(),
    });

    if (status === 'suspended') {
      await db.createNotification({
        _id: `notif-${Date.now()}`,
        userId: doc.sellerId,
        type: 'system',
        title: 'Listing Moderation Notice ⚠️',
        message: `Your listing "${doc.title}" has been placed under review by campus administrators. ${reason ? `Reason: ${reason}` : ''}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: `Listing status updated to ${status}.`,
      data: updated ? await formatProduct(updated, req.user?._id) : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update listing status.' });
  }
}

// Wishlist
export async function toggleWishlist(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Please log in to save items.' });
      return;
    }

    const { productId } = req.body;
    const result = await db.toggleWishlist(req.user._id, productId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to toggle wishlist.' });
  }
}

export async function getUserWishlist(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const [savedIds, allProducts] = await Promise.all([
      db.getUserWishlist(req.user._id),
      db.getAllProducts(),
    ]);
    const savedDocs = allProducts.filter((p) => savedIds.includes(p._id));
    const products = await formatProductsBatch(savedDocs, req.user._id);

    res.json({ success: true, data: products, total: products.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get wishlist.' });
  }
}

// Seller Dashboard Listings
export async function getMyListings(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const userDocs = (await db.getAllProducts()).filter((p) => p.sellerId === req.user!._id);
    const allUserProducts = await formatProductsBatch(userDocs, req.user._id);

    const totalViews = allUserProducts.reduce((acc, curr) => acc + (curr.views || 0), 0);
    const activeCount = allUserProducts.filter((p) => p.status === 'active').length;
    const soldCount = allUserProducts.filter((p) => p.status === 'sold').length;
    const inactiveCount = allUserProducts.filter((p) => p.status === 'inactive').length;

    const statsData = {
      total: allUserProducts.length,
      active: activeCount,
      sold: soldCount,
      inactive: inactiveCount,
      totalViews,
    };

    const status = req.query.status as string | undefined;
    let filteredList = allUserProducts;
    if (status && status !== 'all') {
      filteredList = allUserProducts.filter((p) => p.status === status);
    }

    res.json({
      success: true,
      data: {
        products: filteredList,
        stats: statsData,
      },
      products: filteredList,
      stats: statsData,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch seller listings.' });
  }
}

// Services & Graduation Sales
export async function getCampusServices(req: Request, res: Response): Promise<void> {
  try {
    const { universityId, category } = req.query;
    const [allServices, allUsers] = await Promise.all([db.getAllServices(), db.getAllUsers()]);
    const userMap = new Map(allUsers.map((u) => [u._id, u]));

    let list = allServices;
    if (universityId && universityId !== 'all') {
      list = list.filter((s) => s.universityId === universityId);
    }
    if (category && category !== 'all' && category !== 'All') {
      list = list.filter((s) => s.category.toLowerCase() === (category as string).toLowerCase());
    }

    const formatted = list.map((s) => {
      const provider = userMap.get(s.providerId);
      return {
        id: s._id,
        providerId: s.providerId,
        providerName: provider?.name || 'Campus Expert',
        providerAvatar: provider?.avatar,
        universityId: s.universityId,
        title: s.title,
        category: s.category,
        rate: s.rate,
        location: s.location,
        rating: s.rating,
        reviewsCount: s.reviewsCount,
        description: s.description,
        status: s.status,
      };
    });
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch services.' });
  }
}

export async function createCampusService(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized. Please login to offer a service.' });
      return;
    }

    const { title, category, rate, location, description } = req.body;

    if (!title || !category || !rate || !description) {
      res.status(400).json({ success: false, error: 'Title, category, rate, and description are required.' });
      return;
    }

    const newService: IServiceDocument = {
      _id: `serv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      providerId: req.user._id,
      universityId: req.user.universityId || 'univ-baust',
      title: title.trim(),
      category: category.trim(),
      rate: rate.trim().startsWith('৳') ? rate.trim() : `৳ ${rate.trim()}`,
      location: location?.trim() || `${req.user.universityId || 'Campus'} (On Campus)`,
      rating: 5.0,
      reviewsCount: 1,
      description: description.trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    await db.createService(newService);

    const provider = await db.findUserById(req.user._id);
    const formatted = {
      id: newService._id,
      providerId: newService.providerId,
      providerName: provider?.name || req.user.name || 'Campus Member',
      providerAvatar: provider?.avatar || req.user.avatar,
      universityId: newService.universityId,
      title: newService.title,
      category: newService.category,
      rate: newService.rate,
      location: newService.location,
      rating: newService.rating,
      reviewsCount: newService.reviewsCount,
      description: newService.description,
      status: newService.status,
    };

    res.status(201).json({
      success: true,
      message: 'Service offered successfully!',
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create campus service.' });
  }
}

export async function getServiceCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await db.getServiceCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch service categories.' });
  }
}

export async function addServiceCategory(req: Request, res: Response): Promise<void> {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, error: 'Category name is required.' });
      return;
    }
    const categories = await db.addServiceCategory(name.trim());
    res.json({ success: true, message: 'Category added successfully.', data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add service category.' });
  }
}

export async function deleteServiceCategory(req: Request, res: Response): Promise<void> {
  try {
    const { name } = req.params;
    if (!name) {
      res.status(400).json({ success: false, error: 'Category name parameter is required.' });
      return;
    }
    const categories = await db.deleteServiceCategory(decodeURIComponent(name));
    res.json({ success: true, message: 'Category removed successfully.', data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to remove service category.' });
  }
}

export async function getGraduationSales(req: Request, res: Response): Promise<void> {
  try {
    const { universityId } = req.query;
    const [allSales, allUsers, allUnivs, allProds] = await Promise.all([
      db.getAllGraduationSales(),
      db.getAllUsers(),
      db.getAllUniversities(),
      db.getAllProducts(),
    ]);

    let list = allSales;
    if (universityId && universityId !== 'all') {
      list = list.filter((gs) => gs.universityId === universityId);
    }

    const userMap = new Map(allUsers.map((u) => [u._id, u]));
    const univMap = new Map(allUnivs.map((u) => [u._id, u]));
    const formattedAllProds = await formatProductsBatch(allProds);
    const prodMap = new Map(formattedAllProds.map((p) => [p.id, p]));

    const formatted = list.map((gs) => {
      const student = userMap.get(gs.studentId);
      const univ = univMap.get(gs.universityId);
      const featured = gs.featuredProductIds
        .map((id) => prodMap.get(id))
        .filter((p): p is Product => Boolean(p));

      return {
        id: gs._id,
        studentId: gs.studentId,
        studentName: student?.name || 'Graduating Senior',
        studentAvatar: student?.avatar,
        universityId: gs.universityId,
        universityShortName: univ?.shortName || 'BAUST',
        departmentCode: gs.departmentCode,
        graduatingTerm: gs.graduatingTerm,
        quote: gs.quote,
        itemCount: gs.itemCount,
        featuredProducts: featured,
      };
    });
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch graduation sales.' });
  }
}

export async function createGraduationSale(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized. Please login to post a graduation sale.' });
      return;
    }

    const { graduatingTerm, quote, featuredProductIds } = req.body;
    if (!graduatingTerm || !quote) {
      res.status(400).json({ success: false, error: 'Graduating term and farewell quote are required.' });
      return;
    }

    const allProducts = await db.getAllProducts();
    let productIds: string[] = Array.isArray(featuredProductIds) ? featuredProductIds : [];
    if (productIds.length === 0) {
      productIds = allProducts
        .filter((p) => p.sellerId === req.user!._id && p.status === 'active')
        .slice(0, 6)
        .map((p) => p._id);
    }

    const [dept, univ, allSales] = await Promise.all([
      db.findDepartmentById(req.user.departmentId),
      db.findUniversityById(req.user.universityId),
      db.getAllGraduationSales(),
    ]);

    const existing = allSales.find((s) => s.studentId === req.user!._id);

    if (existing) {
      const updates = {
        graduatingTerm: graduatingTerm.trim(),
        quote: quote.trim(),
        featuredProductIds: productIds,
        itemCount: productIds.length,
      };
      const updatedSale = (await db.updateGraduationSale(existing._id, updates))!;
      const featured = await formatProductsBatch(
        allProducts.filter((p) => updatedSale.featuredProductIds.includes(p._id))
      );

      const formatted = {
        id: updatedSale._id,
        studentId: updatedSale.studentId,
        studentName: req.user.name || 'Graduating Senior',
        studentAvatar: req.user.avatar,
        universityId: updatedSale.universityId,
        universityShortName: univ?.shortName || 'BAUST',
        departmentCode: updatedSale.departmentCode,
        graduatingTerm: updatedSale.graduatingTerm,
        quote: updatedSale.quote,
        itemCount: updatedSale.itemCount,
        featuredProducts: featured,
      };

      res.status(200).json({
        success: true,
        message: 'Existing graduation clearance bundle updated!',
        data: formatted,
      });
      return;
    }

    const newSale: IGraduationSaleDocument = {
      _id: `gs-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: req.user._id,
      universityId: req.user.universityId || 'univ-baust',
      departmentCode: dept?.code || 'CSE',
      graduatingTerm: graduatingTerm.trim(),
      quote: quote.trim(),
      itemCount: productIds.length,
      featuredProductIds: productIds,
      createdAt: new Date().toISOString(),
    };

    await db.createGraduationSale(newSale);

    const featured = await formatProductsBatch(
      allProducts.filter((p) => newSale.featuredProductIds.includes(p._id))
    );

    const formatted = {
      id: newSale._id,
      studentId: newSale.studentId,
      studentName: req.user.name || 'Graduating Senior',
      studentAvatar: req.user.avatar,
      universityId: newSale.universityId,
      universityShortName: univ?.shortName || 'BAUST',
      departmentCode: newSale.departmentCode,
      graduatingTerm: newSale.graduatingTerm,
      quote: newSale.quote,
      itemCount: newSale.itemCount,
      featuredProducts: featured,
    };

    res.status(201).json({
      success: true,
      message: 'Graduation clearance bundle posted successfully!',
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create graduation sale bundle.' });
  }
}

export async function updateGraduationSale(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized. Please login to update this sale.' });
      return;
    }
    const { id } = req.params;
    const sale = await db.findGraduationSaleById(id);
    if (!sale) {
      res.status(404).json({ success: false, error: 'Graduation sale not found.' });
      return;
    }

    if (sale.studentId !== req.user._id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Forbidden. You can only update your own graduation sale.' });
      return;
    }

    const { graduatingTerm, quote, featuredProductIds } = req.body;
    const updates: any = {};
    if (graduatingTerm !== undefined) updates.graduatingTerm = graduatingTerm.trim();
    if (quote !== undefined) updates.quote = quote.trim();
    if (Array.isArray(featuredProductIds)) {
      updates.featuredProductIds = featuredProductIds;
      updates.itemCount = featuredProductIds.length;
    }

    const updatedSale = await db.updateGraduationSale(id, updates);
    if (!updatedSale) {
      res.status(404).json({ success: false, error: 'Failed to update graduation sale.' });
      return;
    }

    const [student, univ, allProducts] = await Promise.all([
      db.findUserById(updatedSale.studentId),
      db.findUniversityById(updatedSale.universityId),
      db.getAllProducts(),
    ]);

    const featured = await formatProductsBatch(
      allProducts.filter((p) => updatedSale.featuredProductIds.includes(p._id))
    );

    const formatted = {
      id: updatedSale._id,
      studentId: updatedSale.studentId,
      studentName: student?.name || 'Graduating Senior',
      studentAvatar: student?.avatar,
      universityId: updatedSale.universityId,
      universityShortName: univ?.shortName || 'BAUST',
      departmentCode: updatedSale.departmentCode,
      graduatingTerm: updatedSale.graduatingTerm,
      quote: updatedSale.quote,
      itemCount: updatedSale.itemCount,
      featuredProducts: featured,
    };

    res.json({
      success: true,
      message: 'Graduation clearance bundle updated successfully!',
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update graduation sale.' });
  }
}

export async function deleteGraduationSale(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized. Please login to delete this sale.' });
      return;
    }
    const { id } = req.params;
    const sale = await db.findGraduationSaleById(id);
    if (!sale) {
      res.status(404).json({ success: false, error: 'Graduation sale not found.' });
      return;
    }

    if (sale.studentId !== req.user._id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Forbidden. You can only delete your own graduation sale.' });
      return;
    }

    const deleted = await db.deleteGraduationSale(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Failed to delete graduation sale.' });
      return;
    }

    res.json({
      success: true,
      message: 'Graduation clearance bundle deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete graduation sale.' });
  }
}

// Guides & Campus Safety
export async function getGuides(_req: Request, res: Response): Promise<void> {
  try {
    const rawGuides = await db.getAllGuides();
    const list = rawGuides.map((g) => ({
      id: g._id,
      category: g.category,
      title: g.title,
      summary: g.summary,
      content: g.content,
      order: g.order,
      updatedAt: g.updatedAt,
    }));
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch campus guides.' });
  }
}

export async function createGuide(req: Request, res: Response): Promise<void> {
  try {
    const { category, title, summary, content, order } = req.body;
    if (!title || !summary || !content) {
      res.status(400).json({ success: false, error: 'Title, summary, and content are required.' });
      return;
    }
    const newGuide: IGuideDocument = {
      _id: `guide-${Date.now()}`,
      category: category || 'freshers',
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      order: typeof order === 'number' ? order : 1,
      updatedAt: new Date().toISOString(),
    };
    const created = await db.createGuide(newGuide);
    res.status(201).json({
      success: true,
      message: 'Guide created successfully.',
      data: {
        id: created._id,
        category: created.category,
        title: created.title,
        summary: created.summary,
        content: created.content,
        order: created.order,
        updatedAt: created.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create guide.' });
  }
}

export async function updateGuide(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { category, title, summary, content, order } = req.body;
    const updated = await db.updateGuide(id, {
      ...(category && { category }),
      ...(title && { title: title.trim() }),
      ...(summary && { summary: summary.trim() }),
      ...(content && { content: content.trim() }),
      ...(typeof order === 'number' && { order }),
    });
    if (!updated) {
      res.status(404).json({ success: false, error: 'Guide not found.' });
      return;
    }
    res.json({
      success: true,
      message: 'Guide updated successfully.',
      data: {
        id: updated._id,
        category: updated.category,
        title: updated.title,
        summary: updated.summary,
        content: updated.content,
        order: updated.order,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update guide.' });
  }
}

export async function deleteGuide(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const success = await db.deleteGuide(id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Guide not found.' });
      return;
    }
    res.json({ success: true, message: 'Guide removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete guide.' });
  }
}
