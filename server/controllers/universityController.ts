import { Request, Response } from 'express';
import { db } from '../db/store';
import { IUniversityDocument, IDepartmentDocument } from '../db/schema';
import { University, Department } from '../../src/types';

export function formatUniversity(univ: IUniversityDocument): University {
  return {
    id: univ._id,
    name: univ.name,
    shortName: univ.shortName,
    domain: univ.domain,
    location: univ.location,
    logo: univ.logo,
    departmentIds: univ.departmentIds || [],
    createdAt: univ.createdAt,
    updatedAt: univ.updatedAt,
  };
}

export function formatDepartment(dept: IDepartmentDocument): Department {
  return {
    id: dept._id,
    name: dept.name,
    code: dept.code,
    universityId: dept.universityId,
    createdAt: dept.createdAt,
  };
}

export async function getUniversities(_req: Request, res: Response): Promise<void> {
  try {
    const list = (await db.getAllUniversities()).map(formatUniversity);
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch universities.' });
  }
}

export async function getUniversityById(req: Request, res: Response): Promise<void> {
  try {
    const univ = await db.findUniversityById(req.params.id);
    if (!univ) {
      res.status(404).json({ success: false, error: 'University not found.' });
      return;
    }
    const departments = (await db.getDepartmentsByUniversity(univ._id)).map(formatDepartment);
    res.json({
      success: true,
      data: {
        ...formatUniversity(univ),
        departments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch university details.' });
  }
}

export async function createUniversity(req: Request, res: Response): Promise<void> {
  try {
    const { name, shortName, domain, location, logo } = req.body;
    if (!name || !shortName || !domain) {
      res.status(400).json({ success: false, error: 'Name, short name, and domain are required.' });
      return;
    }

    const newId = `univ-${shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
    const newUniv: IUniversityDocument = {
      _id: newId,
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
      domain: domain.trim().toLowerCase(),
      location: location || '',
      logo: logo || '🏛️',
      departmentIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await db.createUniversity(newUniv);
    res.status(201).json({ success: true, message: 'University created successfully.', data: formatUniversity(created) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create university.' });
  }
}

export async function updateUniversity(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, shortName, domain, location, logo } = req.body;

    const updated = await db.updateUniversity(id, {
      ...(name ? { name: name.trim() } : {}),
      ...(shortName ? { shortName: shortName.trim().toUpperCase() } : {}),
      ...(domain ? { domain: domain.trim().toLowerCase() } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(logo !== undefined ? { logo } : {}),
    });

    if (!updated) {
      res.status(404).json({ success: false, error: 'University not found.' });
      return;
    }

    res.json({ success: true, message: 'University updated successfully.', data: formatUniversity(updated) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update university.' });
  }
}

export async function deleteUniversity(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = await db.deleteUniversity(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'University not found.' });
      return;
    }
    res.json({ success: true, message: 'University and related departments removed.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete university.' });
  }
}

// Department Endpoints
export async function getDepartments(req: Request, res: Response): Promise<void> {
  try {
    const universityId = req.query.universityId as string;
    const list = universityId
      ? await db.getDepartmentsByUniversity(universityId)
      : await db.getAllDepartments();
    res.json({ success: true, data: list.map(formatDepartment) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch departments.' });
  }
}

export async function createDepartment(req: Request, res: Response): Promise<void> {
  try {
    const { name, code, universityId } = req.body;
    if (!name || !code || !universityId) {
      res.status(400).json({ success: false, error: 'Department name, code, and university ID are required.' });
      return;
    }

    const univ = await db.findUniversityById(universityId);
    if (!univ) {
      res.status(404).json({ success: false, error: 'Target university does not exist.' });
      return;
    }

    const newDeptId = `dept-${univ.shortName.toLowerCase()}-${code.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-3)}`;
    const newDept: IDepartmentDocument = {
      _id: newDeptId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      universityId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await db.createDepartment(newDept);
    res.status(201).json({ success: true, message: 'Department created.', data: formatDepartment(created) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create department.' });
  }
}

export async function updateDepartment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    const updated = await db.updateDepartment(id, {
      ...(name ? { name: name.trim() } : {}),
      ...(code ? { code: code.trim().toUpperCase() } : {}),
    });

    if (!updated) {
      res.status(404).json({ success: false, error: 'Department not found.' });
      return;
    }

    res.json({ success: true, message: 'Department updated.', data: formatDepartment(updated) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update department.' });
  }
}

export async function deleteDepartment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = await db.deleteDepartment(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Department not found.' });
      return;
    }
    res.json({ success: true, message: 'Department removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete department.' });
  }
}
