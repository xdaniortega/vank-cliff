import React from 'react';
import { useCompanyLastPayrolls } from '../hooks/useCompanyLastPayrolls';
import { formatDate, formatAmount } from '../utils/formatters';

interface PayrollScheduleDetailsProps {
  companyAddress: string;
}

export function PayrollScheduleDetails({ companyAddress }: PayrollScheduleDetailsProps) {
  const { payrolls, isLoading, error, refresh, totalPayrolls } = useCompanyLastPayrolls(companyAddress);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-600">Loading payroll information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-2">Error loading payroll information</div>
        <p className="text-sm text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Last 3 Payrolls</h3>
          {totalPayrolls > 0 && (
            <p className="text-sm text-gray-500 mt-1">Total Payrolls: {totalPayrolls}</p>
          )}
        </div>
        <button
          onClick={() => refresh()}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          disabled={isLoading}
        >
          <svg 
            className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {!payrolls.length ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No payrolls found for this company</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payrolls.map((payroll) => (
            <div key={payroll.payrollId.toString()} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-medium text-gray-900">
                    Payroll #{payroll.payrollId.toString()}
                  </h4>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      payroll.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {payroll.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(payroll.startTime)} - {formatDate(payroll.endTime)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-base font-semibold text-gray-900">
                    {formatAmount(payroll.totalAmount)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Claimed:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {formatAmount(payroll.claimedAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Position:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    #{payroll.positionIndex.toString()}
                  </span>
                </div>
              </div>

              {payroll.beneficiaries.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-900">Beneficiaries</h5>
                    <span className="text-xs text-gray-500">
                      {payroll.beneficiaries.length} total
                    </span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {payroll.beneficiaries.map((beneficiary, index) => (
                      <div key={index} className="flex justify-between items-center text-sm py-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 font-medium">
                            {beneficiary.beneficiary.slice(0, 6)}...{beneficiary.beneficiary.slice(-4)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            beneficiary.hasClaimed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {beneficiary.hasClaimed ? 'Claimed' : 'Pending'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-900">{formatAmount(beneficiary.amount)}</div>
                          <div className="text-xs text-gray-500">
                            Unlocks: {formatDate(beneficiary.unlockTime)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 