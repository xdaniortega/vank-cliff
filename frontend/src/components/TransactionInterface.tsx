'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { useState } from 'react';
import { 
  Send, 
  User, 
  Building, 
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useTransactionMonitor } from '@/hooks/useTransactionMonitor';
import { useWalletInfo } from '@/hooks/useWalletInfo';

interface TransactionInterfaceProps {
  companyAddress?: string;
  employeeAddresses?: string[];
  className?: string;
}

const TransactionInterface = ({ 
  companyAddress = '0x742E8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf12',
  employeeAddresses = [
    '0x123e8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf34',
    '0x456e8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf56',
    '0x789e8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf78'
  ],
  className 
}: TransactionInterfaceProps) => {
  const [selectedAddress, setSelectedAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState<'salary' | 'fee'>('salary');
  
  const { 
    sendTransaction, 
    isTransactionPending, 
    lastTransactionHash, 
    error 
  } = useTransactionMonitor();
  
  const { address: connectedAddress, isConnected } = useWalletInfo();

  const handleSendTransaction = async () => {
    if (!selectedAddress || !amount) return;
    
    const finalDescription = description || (transactionType === 'salary' ? 'Salary Payment' : 'Fee Payment');
    await sendTransaction(selectedAddress, amount, finalDescription);
    
    // Clear form after successful transaction
    if (!error) {
      setSelectedAddress('');
      setAmount('');
      setDescription('');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const isFormValid = selectedAddress && amount && parseFloat(amount) > 0;

  return (
    <div 
      className={className}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: spacing.lg,
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.background
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: colors.primary,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Send size={18} color="white" strokeWidth={2.5} />
          </div>
          <h3 style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            margin: 0
          }}>
            Send Payment
          </h3>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: spacing.lg }}>
        {/* Connection Status */}
        {!isConnected && (
          <div style={{
            padding: spacing.md,
            backgroundColor: `${colors.warning}10`,
            border: `1px solid ${colors.warning}`,
            borderRadius: '8px',
            marginBottom: spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <AlertCircle size={16} color={colors.warning} />
            <span style={{
              fontSize: typography.fontSize.sm,
              color: colors.warning,
              fontWeight: typography.fontWeight.medium
            }}>
              Please connect your wallet to send transactions
            </span>
          </div>
        )}

        {/* Transaction Type */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={{
            display: 'block',
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            marginBottom: spacing.sm
          }}>
            Transaction Type
          </label>
          <div style={{
            display: 'flex',
            gap: spacing.sm
          }}>
            <button
              onClick={() => setTransactionType('salary')}
              style={{
                flex: 1,
                padding: spacing.md,
                backgroundColor: transactionType === 'salary' ? colors.primary : 'transparent',
                color: transactionType === 'salary' ? 'white' : colors.text.primary,
                border: `1px solid ${transactionType === 'salary' ? colors.primary : colors.border}`,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs
              }}
            >
              <User size={16} />
              Salary Payment
            </button>
            <button
              onClick={() => setTransactionType('fee')}
              style={{
                flex: 1,
                padding: spacing.md,
                backgroundColor: transactionType === 'fee' ? colors.primary : 'transparent',
                color: transactionType === 'fee' ? 'white' : colors.text.primary,
                border: `1px solid ${transactionType === 'fee' ? colors.primary : colors.border}`,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs
              }}
            >
              <Building size={16} />
              Fee Payment
            </button>
          </div>
        </div>

        {/* Recipient Address */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={{
            display: 'block',
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            marginBottom: spacing.sm
          }}>
            Recipient Address
          </label>
          <select
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            disabled={!isConnected}
            style={{
              width: '100%',
              padding: spacing.md,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: typography.fontSize.sm,
              backgroundColor: isConnected ? 'white' : colors.surface,
              color: colors.text.primary,
              cursor: isConnected ? 'pointer' : 'not-allowed'
            }}
          >
            <option value="">Select recipient...</option>
            <optgroup label="Company">
              <option value={companyAddress}>
                Company Wallet ({formatAddress(companyAddress)})
              </option>
            </optgroup>
            <optgroup label="Employees">
              {employeeAddresses.map((address, index) => (
                <option key={address} value={address}>
                  Employee {index + 1} ({formatAddress(address)})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={{
            display: 'block',
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            marginBottom: spacing.sm
          }}>
            Amount (ETH)
          </label>
          <div style={{
            position: 'relative'
          }}>
            <input
              type="number"
              step="0.001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!isConnected}
              style={{
                width: '100%',
                padding: spacing.md,
                paddingLeft: '40px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm,
                backgroundColor: isConnected ? 'white' : colors.surface,
                color: colors.text.primary,
                outline: 'none'
              }}
            />
            <DollarSign 
              size={16} 
              color={colors.text.secondary}
              style={{
                position: 'absolute',
                left: spacing.sm,
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={{
            display: 'block',
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            marginBottom: spacing.sm
          }}>
            Description (Optional)
          </label>
          <input
            type="text"
            placeholder={transactionType === 'salary' ? 'Monthly salary payment' : 'Service fee payment'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isConnected}
            style={{
              width: '100%',
              padding: spacing.md,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: typography.fontSize.sm,
              backgroundColor: isConnected ? 'white' : colors.surface,
              color: colors.text.primary,
              outline: 'none'
            }}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: spacing.md,
            backgroundColor: `${colors.error}10`,
            border: `1px solid ${colors.error}`,
            borderRadius: '8px',
            marginBottom: spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <AlertCircle size={16} color={colors.error} />
            <span style={{
              fontSize: typography.fontSize.sm,
              color: colors.error
            }}>
              {error}
            </span>
          </div>
        )}

        {/* Success Display */}
        {lastTransactionHash && !isTransactionPending && !error && (
          <div style={{
            padding: spacing.md,
            backgroundColor: `${colors.success}10`,
            border: `1px solid ${colors.success}`,
            borderRadius: '8px',
            marginBottom: spacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <CheckCircle2 size={16} color={colors.success} />
            <div>
              <span style={{
                fontSize: typography.fontSize.sm,
                color: colors.success,
                fontWeight: typography.fontWeight.medium,
                display: 'block'
              }}>
                Transaction sent successfully!
              </span>
              <span style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary
              }}>
                Hash: {formatAddress(lastTransactionHash)}
              </span>
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendTransaction}
          disabled={!isConnected || !isFormValid || isTransactionPending}
          style={{
            width: '100%',
            padding: spacing.md,
            backgroundColor: (!isConnected || !isFormValid || isTransactionPending) 
              ? colors.text.light 
              : colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            cursor: (!isConnected || !isFormValid || isTransactionPending) 
              ? 'not-allowed' 
              : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm
          }}
        >
          {isTransactionPending ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Processing Transaction...
            </>
          ) : (
            <>
              <Send size={16} />
              Send Payment
            </>
          )}
        </button>

        {/* Help Text */}
        <div style={{
          marginTop: spacing.md,
          fontSize: typography.fontSize.xs,
          color: colors.text.secondary,
          textAlign: 'center'
        }}>
          Transaction details will be displayed in real-time using Blockscout
        </div>
      </div>
    </div>
  );
};

export default TransactionInterface; 