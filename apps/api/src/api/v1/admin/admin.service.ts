import { getFirestore } from '../../../lib/firebase-admin';

export class AdminService {
  private get db() {
    return getFirestore();
  }

  async getDashboardStats() {
    const usersCount = await this.db.collection('users').count().get();
    const tutorsCount = await this.db.collection('tutors').count().get();
    const sessionsCount = await this.db.collection('sessions').count().get();
    const reportsCount = await this.db.collection('reports').count().get();
    
    // Revenue logic would require summing up captured payments, 
    // for simplicity, we return counts.
    
    return {
      totalUsers: usersCount.data().count,
      totalTutors: tutorsCount.data().count,
      totalSessions: sessionsCount.data().count,
      totalReports: reportsCount.data().count,
    };
  }

  async getReports(page: number, limit: number) {
    const snapshot = await this.db.collection('reports')
      .orderBy('createdAt', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)
      .get();

    return {
      data: snapshot.docs.map(doc => doc.data()),
      meta: { page, limit, total: 0, hasMore: false }
    };
  }

  async updateReportStatus(reportId: string, status: string, resolutionNotes?: string) {
    const reportRef = this.db.collection('reports').doc(reportId);
    await reportRef.update({
      status,
      resolutionNotes: resolutionNotes || null,
      updatedAt: new Date()
    });
  }
  async getPayments(page: number, limit: number) {
    const snapshot = await this.db.collection('payments')
      .orderBy('createdAt', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)
      .get();
      
    const countSnapshot = await this.db.collection('payments').count().get();
    const total = countSnapshot.data().count;

    return {
      data: snapshot.docs.map(doc => doc.data()),
      meta: { page, limit, total, hasMore: (page * limit) < total }
    };
  }

  async getPaymentStats() {
    const paymentsSnap = await this.db.collection('payments').where('status', '==', 'captured').get();
    let totalVolume = 0;
    paymentsSnap.docs.forEach(doc => {
      totalVolume += doc.data().amount || 0;
    });

    const pendingPayoutsSnap = await this.db.collection('payments').where('status', '==', 'processing').get();
    let pendingPayouts = 0;
    pendingPayoutsSnap.docs.forEach(doc => {
      pendingPayouts += doc.data().amount || 0;
    });

    const failedTxCount = await this.db.collection('payments').where('status', '==', 'failed').count().get();

    return {
      totalVolume,
      platformRevenue: totalVolume * 0.10, // assuming 10%
      pendingPayouts,
      failedTransactions: failedTxCount.data().count
    };
  }
}

export const adminService = new AdminService();
