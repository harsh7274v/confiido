'use client';
import { useState } from 'react';
import { DollarSign, CreditCard, Building2, ArrowUpRight, ArrowDownRight, Download, Plus, Wallet as WalletIcon, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function Wallet() {
  const [activeTab, setActiveTab] = useState('overview');

  const walletStats = {
    availableBalance: 2450.00,
    pendingBalance: 850.00,
    totalEarned: 12500.00,
    thisMonth: 3200.00
  };

  const transactions = [
    {
      id: 1,
      type: 'credit',
      amount: 150.00,
      description: 'Session with Sarah Johnson',
      date: '2024-01-15',
      status: 'completed',
      method: 'Credit Card'
    },
    {
      id: 2,
      type: 'debit',
      amount: 500.00,
      description: 'Withdrawal to Bank Account',
      date: '2024-01-10',
      status: 'completed',
      method: 'Bank Transfer'
    },
    {
      id: 3,
      type: 'credit',
      amount: 200.00,
      description: 'Session with Mike Chen',
      date: '2024-01-08',
      status: 'completed',
      method: 'Credit Card'
    },
    {
      id: 4,
      type: 'credit',
      amount: 120.00,
      description: 'Session with Alice Smith',
      date: '2024-01-05',
      status: 'pending',
      method: 'Credit Card'
    },
    {
      id: 5,
      type: 'debit',
      amount: 300.00,
      description: 'Withdrawal to Bank Account',
      date: '2023-12-28',
      status: 'completed',
      method: 'Bank Transfer'
    }
  ];

  const paymentMethods = [
    {
      id: 1,
      type: 'bank',
      name: 'Chase Bank',
      account: '****1234',
      isDefault: true,
      icon: Building2
    },
    {
      id: 2,
      type: 'card',
      name: 'Visa ending in 5678',
      account: '****5678',
      isDefault: false,
      icon: CreditCard
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Lumina
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/profile" className="text-slate-600 hover:text-slate-900">
                Profile
              </Link>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Wallet</h1>
          <p className="text-slate-600 mt-2">Manage your earnings, withdrawals, and payment methods.</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <WalletIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Available Balance</p>
                <p className="text-2xl font-bold text-slate-900">${walletStats.availableBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Pending Balance</p>
                <p className="text-2xl font-bold text-slate-900">${walletStats.pendingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Total Earned</p>
                <p className="text-2xl font-bold text-slate-900">${walletStats.totalEarned.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">This Month</p>
                <p className="text-2xl font-bold text-slate-900">${walletStats.thisMonth.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Add Payment Method</span>
            </button>
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <ArrowUpRight className="h-5 w-5" />
              <span>Withdraw Funds</span>
            </button>
            <button className="bg-slate-600 text-white px-6 py-3 rounded-lg hover:bg-slate-700 flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Export Statement</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'transactions', name: 'Transactions' },
                { id: 'payment-methods', name: 'Payment Methods' },
                { id: 'withdrawals', name: 'Withdrawals' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Transactions */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Transactions</h3>
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {transaction.type === 'credit' ? (
                              <ArrowDownRight className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{transaction.description}</p>
                            <p className="text-sm text-slate-500">{transaction.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-slate-500">{transaction.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Methods</h3>
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <method.icon className="h-6 w-6 text-slate-600" />
                          <div>
                            <p className="font-medium text-slate-900">{method.name}</p>
                            <p className="text-sm text-slate-500">{method.account}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {method.isDefault && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Default
                            </span>
                          )}
                          <button className="text-sm text-blue-600 hover:text-blue-700">
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-400">
                      + Add Payment Method
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-slate-900">All Transactions</h3>
                  <div className="flex items-center space-x-4">
                    <select className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>All Types</option>
                      <option>Credits</option>
                      <option>Debits</option>
                    </select>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      Export CSV
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <ArrowDownRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{transaction.description}</p>
                          <p className="text-sm text-slate-500">{transaction.date} • {transaction.method}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500">{transaction.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'payment-methods' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Payment Methods</h3>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-6 border border-slate-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <method.icon className="h-8 w-8 text-slate-600" />
                        <div>
                          <p className="font-medium text-slate-900">{method.name}</p>
                          <p className="text-sm text-slate-500">{method.account}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {method.isDefault && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            Default
                          </span>
                        )}
                        <button className="text-sm text-blue-600 hover:text-blue-700">Edit</button>
                        <button className="text-sm text-red-600 hover:text-red-700">Remove</button>
                      </div>
                    </div>
                  ))}
                  <button className="w-full p-6 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-400 flex items-center justify-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Add New Payment Method</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'withdrawals' && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Withdrawal History</h3>
                <div className="bg-slate-50 rounded-lg p-8 text-center">
                  <p className="text-slate-600">Withdrawal history will be displayed here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 