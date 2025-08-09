'use client';
import { useState } from 'react';
import { Star, MessageCircle, ThumbsUp, ThumbsDown, Edit, Trash2, Reply } from 'lucide-react';
import Link from 'next/link';

export default function Reviews() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const reviews = [
    {
      id: 1,
      author: 'Sarah Johnson',
      rating: 5,
      title: 'Excellent career guidance',
      content: 'John provided incredibly valuable insights for my career transition. His advice was practical and actionable. Highly recommend!',
      date: '2024-01-15',
      type: 'received',
      response: 'Thank you Sarah! I\'m glad I could help with your career journey.',
      helpful: 3,
      notHelpful: 0
    },
    {
      id: 2,
      author: 'Mike Chen',
      rating: 4,
      title: 'Great technical consultation',
      content: 'Very knowledgeable about React and modern web development. Helped me solve a complex state management issue.',
      date: '2024-01-10',
      type: 'received',
      response: null,
      helpful: 1,
      notHelpful: 0
    },
    {
      id: 3,
      author: 'Alice Smith',
      rating: 5,
      title: 'Amazing mentor',
      content: 'John is an exceptional mentor. His guidance helped me land my dream job. The session was worth every penny.',
      date: '2024-01-08',
      type: 'received',
      response: 'Alice, congratulations on your new role! I\'m so happy I could be part of your journey.',
      helpful: 5,
      notHelpful: 0
    },
    {
      id: 4,
      author: 'David Kim',
      rating: 4,
      title: 'Solid advice on product strategy',
      content: 'Good session overall. John shared some useful frameworks for product thinking. Would book again.',
      date: '2024-01-05',
      type: 'received',
      response: null,
      helpful: 2,
      notHelpful: 1
    },
    {
      id: 5,
      author: 'Emily Rodriguez',
      rating: 5,
      title: 'Outstanding session',
      content: 'John is incredibly patient and explains complex concepts clearly. My coding skills improved significantly after just one session.',
      date: '2024-01-03',
      type: 'received',
      response: 'Thank you Emily! Your enthusiasm for learning made the session enjoyable.',
      helpful: 4,
      notHelpful: 0
    }
  ];

  const stats = {
    averageRating: 4.6,
    totalReviews: 127,
    fiveStar: 89,
    fourStar: 25,
    threeStar: 8,
    twoStar: 3,
    oneStar: 2
  };

  const filteredReviews = reviews.filter(review => {
    if (activeFilter === 'all') return true;
    if (activeFilter === '5-star') return review.rating === 5;
    if (activeFilter === '4-star') return review.rating === 4;
    if (activeFilter === '3-star') return review.rating === 3;
    if (activeFilter === '2-star') return review.rating === 2;
    if (activeFilter === '1-star') return review.rating === 1;
    if (activeFilter === 'with-response') return review.response !== null;
    return true;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'rating':
        return b.rating - a.rating;
      case 'helpful':
        return b.helpful - a.helpful;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-slate-300'
        }`}
      />
    ));
  };

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
          <h1 className="text-3xl font-bold text-slate-900">Reviews & Ratings</h1>
          <p className="text-slate-600 mt-2">Manage and respond to reviews from your clients.</p>
        </div>

        {/* Stats Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">{stats.averageRating}</div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p className="text-sm text-slate-600">Average Rating</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-2">{stats.totalReviews}</div>
              <p className="text-sm text-slate-600">Total Reviews</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{Math.round((stats.fiveStar / stats.totalReviews) * 100)}%</div>
              <p className="text-sm text-slate-600">5-Star Reviews</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{reviews.filter(r => r.response).length}</div>
              <p className="text-sm text-slate-600">Responded To</p>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-700">Filter:</span>
              {[
                { id: 'all', name: 'All Reviews' },
                { id: '5-star', name: '5 Stars' },
                { id: '4-star', name: '4 Stars' },
                { id: '3-star', name: '3 Stars' },
                { id: '2-star', name: '2 Stars' },
                { id: '1-star', name: '1 Star' },
                { id: 'with-response', name: 'With Response' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === filter.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="rating">Highest Rated</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {sortedReviews.length > 0 ? (
            sortedReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {review.author.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{review.author}</h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-slate-500">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600" title="Reply">
                      <Reply className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-600" title="Edit">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-red-400 hover:text-red-600" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-slate-900 mb-2">{review.title}</h4>
                  <p className="text-slate-600">{review.content}</p>
                </div>
                
                {review.response && (
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        JD
                      </div>
                      <span className="text-sm font-medium text-slate-900">Your response</span>
                    </div>
                    <p className="text-slate-600 text-sm">{review.response}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-sm text-slate-500 hover:text-slate-700">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{review.helpful}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-sm text-slate-500 hover:text-slate-700">
                      <ThumbsDown className="h-4 w-4" />
                      <span>{review.notHelpful}</span>
                    </button>
                  </div>
                  
                  {!review.response && (
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Reply to Review
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <MessageCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No reviews found</h3>
              <p className="text-slate-600">No reviews match your current filters.</p>
            </div>
          )}
        </div>

        {/* Load More */}
        {sortedReviews.length > 0 && (
          <div className="text-center mt-8">
            <button className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50">
              Load More Reviews
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 