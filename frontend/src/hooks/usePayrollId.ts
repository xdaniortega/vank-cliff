import { useCallback } from 'react';

// Función para obtener el siguiente ID de payroll
export const getNextPayrollId = (companyAddress: string): bigint => {
  const storageKey = `payroll_counter_${companyAddress.toLowerCase()}`;
  const currentCounter = localStorage.getItem(storageKey);
  const nextCounter = currentCounter ? BigInt(currentCounter) + 1n : 1n;
  localStorage.setItem(storageKey, nextCounter.toString());
  return nextCounter;
};

// Función para obtener el último ID usado
export const getLastPayrollId = (companyAddress: string): bigint => {
  const storageKey = `payroll_counter_${companyAddress.toLowerCase()}`;
  const currentCounter = localStorage.getItem(storageKey);
  return currentCounter ? BigInt(currentCounter) : 0n;
};

// Hook para manejar los IDs de payroll
export const usePayrollId = (companyAddress: string | undefined) => {
  const getNextId = useCallback((): bigint => {
    if (!companyAddress) throw new Error('Company address is required');
    return getNextPayrollId(companyAddress);
  }, [companyAddress]);

  const getLastId = useCallback((): bigint => {
    if (!companyAddress) throw new Error('Company address is required');
    return getLastPayrollId(companyAddress);
  }, [companyAddress]);

  return {
    getNextId,
    getLastId
  };
}; 