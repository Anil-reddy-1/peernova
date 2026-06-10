import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useWallet() {
  const { data: balanceData, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/payments/wallet');
      return data.data;
    }
  });

  const { data: txData, isLoading: isTxLoading } = useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/payments/wallet/transactions');
      return data.data; // Array of transactions
    }
  });

  return { 
    balance: balanceData?.balance || 0,
    currency: balanceData?.currency || 'INR',
    transactions: txData || [],
    isLoading: isBalanceLoading || isTxLoading
  };
}

export function useTopup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      const { data } = await apiClient.post('/v1/payments/create-order', { amount });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    }
  });
}
