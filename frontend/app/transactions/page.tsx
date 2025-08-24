"use client";

import React, { useEffect, useState } from 'react';
import { 
  CreditCard, 
  Filter, 
  Search, 
  Download, 
  Eye, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, statusFilter, typeFilter]);

  // Show mock data on mount if no authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && !user && transactions.length === 0) {
      setMockData();
    }
  }, [user, transactions.length]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we have authentication
      const token = localStorage.getItem('token');
      if (!token && !user) {
        // No authentication available, show mock data
        console.log('No authentication available, showing mock data');
        setMockData();
        return;
      }
      
      const params: any = {
        page: currentPage,
        limit: 10
      };
      
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      
      const response = await transactionsApi.getTransactions(params);
      setTransactions(response.transactions);
      setStats(response.stats);
      setTotalPages(response.pagination.pages);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      
      // If it's an authentication error or server error, show mock data
      if (err.message.includes('401') || err.message.includes('500')) {
        console.log('Server error, showing mock data');
        setMockData();
      } else {
        setError(err.message || 'Failed to fetch transactions');
      }
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
         const mockTransactions: Transaction[] = [
              {
          _id: '1',
          user_id: '1001',
          transaction_id: 'TXN001',
          status: 'completed',
          mentor_name: 'Priya Sharma',
          service: 'Career Coaching',
          userId: 'user1',
          type: 'booking',
          itemId: 'booking1',
          amount: 2500,
          currency: 'INR',
          paymentMethod: 'stripe',
          description: 'Career coaching session with Priya Sharma',
          metadata: {
            sessionTitle: 'Career coaching session'
          },
                   expertId: {
             _id: 'expert1',
             firstName: 'Priya',
             lastName: 'Sharma',
             email: 'priya.sharma@example.com',
             profession: 'Product Manager'
           },
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          updatedAt: new Date(Date.now() - 86400000)
        },
        {
          _id: '2',
          user_id: '1001',
          transaction_id: 'TXN002',
          status: 'pending',
          mentor_name: 'Priya Sharma',
          service: 'Online Course',
          userId: 'user1',
          type: 'course',
          itemId: 'course1',
          amount: 5000,
          currency: 'INR',
          paymentMethod: 'paypal',
          description: 'Product Management Fundamentals Course',
          metadata: {
            courseName: 'Product Management Fundamentals'
          },
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
          updatedAt: new Date(Date.now() - 172800000)
        },
        {
          _id: '3',
          user_id: '1001',
          transaction_id: 'TXN003',
          status: 'completed',
          mentor_name: 'Priya Sharma',
          service: 'Webinar',
          userId: 'user1',
          type: 'webinar',
          itemId: 'webinar1',
          amount: 1500,
          currency: 'INR',
          paymentMethod: 'stripe',
          description: 'Leadership Skills Webinar',
          metadata: {
            webinarTitle: 'Leadership Skills Webinar'
          },
          createdAt: new Date(Date.now() - 259200000), // 3 days ago
          updatedAt: new Date(Date.now() - 259200000)
        }
     ];

                   const mockStats: TransactionStats = {
        total: 3,
        completed: 2,
        failed: 0,
        pending: 1,
        totalSpent: 4000
      };

    setTransactions(mockTransactions);
    setStats(mockStats);
    setTotalPages(1);
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

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.metadata?.sessionTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.metadata?.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.metadata?.webinarTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.metadata?.bundleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.metadata?.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to backend server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalSpent.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="lg:w-48">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="booking">Booking</option>
                <option value="course">Course</option>
                <option value="webinar">Webinar</option>
                <option value="bundle">Bundle</option>
                <option value="digital_product">Digital Product</option>
                <option value="priority_dm">Priority DM</option>
              </select>
            </div>

            {/* Export Button */}
            <button className="lg:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>

            {/* Refresh Button */}
            <button 
              onClick={fetchTransactions}
              className="lg:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                     Mentor
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
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Actions
                   </th>
                 </tr>
               </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
                             <button
                               onClick={setMockData}
                               className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                             >
                               Show Demo Data
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
                                     filteredTransactions.map((transaction) => (
                     <tr key={transaction._id} className="hover:bg-gray-50">
                       <td className="px-6 py-4">
                         <div>
                           <p className="text-sm font-medium text-gray-900">
                             {transaction.transaction_id}
                           </p>
                           <p className="text-xs text-gray-500">
                             User: {transaction.user_id}
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
                         <div>
                           <p className="text-sm font-medium text-gray-900">
                             {transaction.mentor_name}
                           </p>
                           <p className="text-xs text-gray-500">
                             {transaction.expertId && `${transaction.expertId.firstName} ${transaction.expertId.lastName}`}
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
                      <td className="px-6 py-4">
                        <button className="text-purple-600 hover:text-purple-900 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
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
