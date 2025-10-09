"use client";
import { PropagateLoader } from 'react-spinners';

import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { transactionsApi, Transaction, TransactionStats } from '../services/transactionsApi';
import { useAuth } from '../contexts/AuthContext';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  // Initialize stats when component mounts
  useEffect(() => {
    if (user && transactions.length === 0 && !loading) {
      setStats(null);
    }
  }, [user, transactions.length, loading]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we have authentication
      const token = localStorage.getItem('token');
      if (!token && !user) {
        setError('Please log in to view your transactions');
        return;
      }
      
      const params: any = {
        page: currentPage,
        limit: 10
      };
      const response = await transactionsApi.getTransactions(params);
      const sorted = [...response.transactions].sort((a: any, b: any) => {
        const aDate = new Date((a as any).createdAt || (a as any).updatedAt).getTime();
        const bDate = new Date((b as any).createdAt || (b as any).updatedAt).getTime();
        return bDate - aDate; // newest first by creation time
      });
      setTransactions(sorted);
      setStats(response.stats);
      setTotalPages(response.pagination.pages);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'refunded':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Remove filteredTransactions and use transactions directly

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex justify-center"><PropagateLoader color="#9333ea" /></div>
          <p className="text-gray-600">Loading transactions...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to backend server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundImage: 'url("/grid.svg")', backgroundRepeat: 'repeat', backgroundPosition: 'center', backgroundSize: 'cover', backgroundColor: '#f5f5f5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-600 rounded-lg">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          </div>
          <p className="text-gray-600">Track all your financial activities and payment history</p>
          {(!localStorage.getItem('token') && !user) && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Demo Mode:</strong> Showing sample transaction data. Connect to backend for real data.
              </p>
            </div>
          )}
        </div>

        {/* Stats removed */}

  {/* Removed search/filter/export/refresh box */}

        {/* Transactions Table */}
  <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
                             <thead className="bg-gray-50 border-b border-gray-200">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Transaction ID
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Service
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Amount
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Status
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Date
                   </th>
                 </tr>
               </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                             {error ? (
                         <div>
                           <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                           <p className="text-lg font-medium text-gray-900 mb-2">Error loading transactions</p>
                           <p className="text-gray-600">{error}</p>
                           <div className="mt-4 space-y-2">
                             <button
                               onClick={fetchTransactions}
                               className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                             >
                               Try Again
                             </button>
                           </div>
                         </div>
                       ) : (
                                                 <div>
                           <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                           <p className="text-lg font-medium text-gray-900 mb-2">No transactions found</p>
                           <p className="text-gray-600">Start by booking a session or purchasing a course</p>
                           {(!localStorage.getItem('token') && !user) && (
                             <p className="text-sm text-blue-600 mt-2">Demo mode: Sample data will appear here</p>
                           )}
                         </div>
                      )}
                    </td>
                  </tr>
                ) : (
                                     transactions.map((transaction) => (
                     <tr key={transaction._id} className="hover:bg-gray-50">
                       <td className="px-6 py-4">
                         <div>
                           <p className="text-sm font-medium text-gray-900">
                            {(transaction as any).transactionId || (transaction as any).transaction_id || transaction._id}
                           </p>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <div>
                           <p className="text-sm font-medium text-gray-900">
                             {transaction.service}
                           </p>
                           <p className="text-xs text-gray-500">
                             {transaction.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                           </p>
                         </div>
                       </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {formatDate(transaction.createdAt)}
                            </span>
                          </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
