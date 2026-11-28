import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { University, Department } from '../types';
import { universityApi } from '../services/api';

interface UniversityContextType {
  universities: University[];
  departments: Department[];
  selectedUniversity: University | null;
  selectedUniversityId: string;
  setSelectedUniversityId: (id: string) => void;
  isLoading: boolean;
  refreshUniversities: () => Promise<void>;
  getDepartmentsForUniversity: (univId: string) => Department[];
}

const UniversityContext = createContext<UniversityContextType | undefined>(undefined);

function getInitialUniversityId(): string {
  try {
    return localStorage.getItem('unimart_selected_univ') || 'univ-baust';
  } catch {
    return 'univ-baust';
  }
}

export const UniversityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedUniversityId, setSelectedUniversityIdState] = useState<string>(getInitialUniversityId);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [univRes, deptRes] = await Promise.all([
        universityApi.getAll(),
        universityApi.getDepartments(),
      ]);

      if (univRes.success && univRes.data) {
        setUniversities(univRes.data);
      }
      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data);
      }
    } catch (e) {
      console.error('Failed to load universities or departments:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setSelectedUniversityId = useCallback((id: string) => {
    setSelectedUniversityIdState(id);
    try {
      localStorage.setItem('unimart_selected_univ', id);
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const selectedUniversity =
    universities.find((u) => u.id === selectedUniversityId) || universities[0] || null;

  const getDepartmentsForUniversity = useCallback(
    (univId: string) => {
      return departments.filter((d) => d.universityId === univId);
    },
    [departments]
  );

  return (
    <UniversityContext.Provider
      value={{
        universities,
        departments,
        selectedUniversity,
        selectedUniversityId,
        setSelectedUniversityId,
        isLoading,
        refreshUniversities: loadData,
        getDepartmentsForUniversity,
      }}
    >
      {children}
    </UniversityContext.Provider>
  );
};

export function useUniversity() {
  const context = useContext(UniversityContext);
  if (!context) {
    throw new Error('useUniversity must be used within a UniversityProvider');
  }
  return context;
}
