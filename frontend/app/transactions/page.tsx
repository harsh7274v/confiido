"use client";

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

// Skeleton Loader Component
const SkeletonLoader = () => {
  return (
    <>
      <style jsx>{`
        .loader {
          position: relative;
          width: 240px;
          height: 130px;
          margin-bottom: 10px;
          border: 1px solid #d3d3d3;
          padding: 15px;
          background-color: #e3e3e3;
          overflow: hidden;
        }

        .loader:after {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background: linear-gradient(110deg, rgba(227, 227, 227, 0) 0%, rgba(227, 227, 227, 0) 40%, rgba(227, 227, 227, 0.5) 50%, rgba(227, 227, 227, 227, 0) 60%, rgba(227, 227, 227, 0) 100%);
          animation: gradient-animation_2 1.2s linear infinite;
        }

        .loader .wrapper {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .loader .wrapper > div {
          background-color: #cacaca;
        }

        .loader .circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
        }

        .loader .button {
          display: inline-block;
          height: 32px;
          width: 75px;
        }

        .loader .line-1 {
          position: absolute;
          top: 11px;
          left: 58px;
          height: 10px;
          width: 100px;
        }

        .loader .line-2 {
          position: absolute;
          top: 34px;
          left: 58px;
          height: 10px;
          width: 150px;
        }

        .loader .line-3 {
          position: absolute;
          top: 57px;
          left: 0px;
          height: 10px;
          width: 100%;
        }

        .loader .line-4 {
          position: absolute;
          top: 80px;
          left: 0px;
          height: 10px;
          width: 92%;
        }

        @keyframes gradient-animation_2 {
          0% {
            transform: translateX(-100%);
          }

          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      <div className="loader">
        <div className="wrapper">
          <div className="circle"></div>
          <div className="line-1"></div>
          <div className="line-2"></div>
          <div className="line-3"></div>
          <div className="line-4"></div>
        </div>
      </div>
    </>
  );
};

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
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fff0f3', fontFamily: "'Rubik', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide" style={{ color: '#4A4458' }}>
              Transactions
            </h1>
          </div>
          <p className="text-base text-gray-600" style={{ fontFamily: "'Rubik', sans-serif" }}>Track all your financial activities and payment history</p>
          {(!localStorage.getItem('token') && !user) && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Demo Mode:</strong> Showing sample transaction data. Connect to backend for real data.
              </p>
            </div>
          )}
        </div>

        {/* Transactions Table Container */}
        <div className="rounded-4xl p-4 sm:p-6 shadow-lg overflow-hidden" style={{ backgroundColor: '#fadde1' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D5869' }}>
                    Transaction ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D5869' }}>
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D5869' }}>
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D5869' }}>
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5D5869' }}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/30">
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
                              className="px-4 py-2 text-white rounded-xl hover:shadow-lg transition-all"
                              style={{ backgroundColor: '#3a3a3a' }}
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
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-white/30 transition-colors duration-200 rounded-lg group">
                      <td className="px-6 py-4">
                        <div className="bg-white/50 px-3 py-1.5 rounded-lg inline-block">
                          <p className="text-sm font-medium" style={{ color: '#3E5F44' }}>
                            {(transaction as any).transactionId || (transaction as any).transaction_id || transaction._id}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold" style={{ color: '#000000' }}>
                            {transaction.service}
                          </p>
                          <p className="text-xs text-gray-600">
                            {transaction.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold" style={{ color: '#000000' }}>
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {transaction.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                transaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                            }`}>
                            {getStatusIcon(transaction.status)}
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
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
            <div className="px-6 py-4 border-t border-gray-200/50 mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm rounded-xl hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ backgroundColor: '#fff', color: '#5D5869' }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm rounded-xl hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{ backgroundColor: '#fff', color: '#5D5869' }}
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
