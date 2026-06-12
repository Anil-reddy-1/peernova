import { getFirestore, getFieldValue } from '../../../lib/firebase-admin';
const FieldValue = getFieldValue();

import type { WalletTransaction, PaginationMeta } from '@peer-tutoring/types';
import { ValidationError } from '../../../lib/errors';


export class PaymentsService {
  private get db() {
    return getFirestore();
  }

  async getWalletBalance(userId: string): Promise<{ balance: number; currency: string }> {
    const walletDoc = await this.db.collection('wallets').doc(userId).get();
    if (!walletDoc.exists) {
      return { balance: 0, currency: 'INR' };
    }
    const data = walletDoc.data()!;
    return { balance: data.balance || 0, currency: data.currency || 'INR' };
  }

  async getWalletTransactions(userId: string, page: number, limit: number): Promise<{ data: WalletTransaction[], meta: PaginationMeta }> {
    const snapshot = await this.db.collection('wallet_transactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)
      .get();

    const countSnapshot = await this.db.collection('wallet_transactions').where('userId', '==', userId).count().get();
    const total = countSnapshot.data().count;

    return {
      data: snapshot.docs.map(doc => doc.data() as WalletTransaction),
      meta: { page, limit, total, hasMore: (page * limit) < total }
    };
  }

  async createTopupOrder(userId: string, amount: number): Promise<{ orderId: string, amount: number }> {
    if (amount <= 0) throw new ValidationError({ amount: ['Amount must be greater than 0'] });

    const paymentRef = this.db.collection('payments').doc();
    const mockOrderId = `mock_order_${Date.now()}`;

    await this.db.runTransaction(async (t) => {
      // 1. Create Payment record
      t.set(paymentRef, {
        id: paymentRef.id,
        studentId: userId,
        type: 'wallet_topup',
        razorpayOrderId: mockOrderId,
        amount,
        currency: 'INR',
        status: 'captured', // Automatically captured in simplified version
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      // 2. Add to wallet
      const walletRef = this.db.collection('wallets').doc(userId);
      const walletDoc = await t.get(walletRef);
      
      let currentBalance = 0;
      if (walletDoc.exists) {
        currentBalance = walletDoc.data()?.balance || 0;
        t.update(walletRef, {
          balance: currentBalance + amount,
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        t.set(walletRef, {
          userId: userId,
          balance: amount,
          currency: 'INR',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }

      // 3. Record transaction
      const txRef = this.db.collection('wallet_transactions').doc();
      t.set(txRef, {
        id: txRef.id,
        userId: userId,
        type: 'credit',
        amount: amount,
        currency: 'INR',
        status: 'completed',
        referenceId: paymentRef.id,
        referenceType: 'payment',
        description: 'Wallet Topup',
        createdAt: FieldValue.serverTimestamp()
      });
    });

    return { orderId: mockOrderId, amount };
  }
}

export const paymentsService = new PaymentsService();
