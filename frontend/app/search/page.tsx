'use client';
import { useState } from 'react';
import { Search, Filter, Star, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('relevance');

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'technology', name: 'Technology' },
    { id: 'business', name: 'Business' },
    { id: 'career', name: 'Career' },
    { id: 'health', name: 'Health & Wellness' },
    { id: 'creative', name: 'Creative' },
    { id: 'finance', name: 'Finance' },
    { id: 'education', name: 'Education' }
  ];

  const experts = [
    {
      id: 1,
      name: 'Sarah Johnson',
      title: 'Senior Software Engineer',
      company: 'Google',
      rating: 4.9,
      reviews: 127,
      price: 150,
      duration: '60 min',
      location: 'San Francisco, CA',
      skills: ['React', 'Node.js', 'Python', 'AWS'],
      category: 'technology',
      image: 'SJ'
    },
    {
      id: 2,
      name: 'Mike Chen',
      title: 'Product Manager',
      company: 'Microsoft',
      rating: 4.8,
      reviews: 89,
      price: 200,
      duration: '45 min',
      location: 'Seattle, WA',
      skills: ['Product Strategy', 'User Research', 'Agile', 'Analytics'],
      category: 'business',
      image: 'MC'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      title: 'Career Coach',
      company: 'Self-employed',
      rating: 4.7,
      reviews: 156,
      price: 120,
      duration: '60 min',
      location: 'New York, NY',
      skills: ['Resume Writing', 'Interview Prep', 'Career Planning', 'Networking'],
      category: 'career',
      image: 'ER'
    },
    {
      id: 4,
      name: 'David Kim',
      title: 'Financial Advisor',
      company: 'Morgan Stanley',
      rating: 4.9,
      reviews: 203,
      price: 250,
      duration: '90 min',
      location: 'Los Angeles, CA',
      skills: ['Investment Planning', 'Retirement', 'Tax Strategy', 'Estate Planning'],
      category: 'finance',
      image: 'DK'
    },
    {
      id: 5,
      name: 'Lisa Wang',
      title: 'UX Designer',
      company: 'Apple',
      rating: 4.6,
      reviews: 78,
      price: 180,
      duration: '60 min',
      location: 'Cupertino, CA',
      skills: ['UI/UX Design', 'Figma', 'User Research', 'Prototyping'],
      category: 'creative',
      image: 'LW'
    },
    {
      id: 6,
      name: 'James Wilson',
      title: 'Fitness Coach',
      company: 'Self-employed',
      rating: 4.8,
      reviews: 234,
      price: 100,
      duration: '45 min',
      location: 'Miami, FL',
      skills: ['Personal Training', 'Nutrition', 'Weight Loss', 'Strength Training'],
      category: 'health',
      image: 'JW'
    }
  ];

  const filteredExperts = experts.filter(expert => {
    const matchesSearch = expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expert.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || expert.category === selectedCategory;
    const matchesPrice = expert.price >= priceRange[0] && expert.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Find Experts</h1>
              <p className="text-gray-300 mt-1">Connect with verified professionals in your field</p>
            </div>
            <Link href="/dashboard" className="text-gray-300 hover:text-white">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 sticky top-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </h2>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search experts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">Price Range</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
                >
                  <option value="relevance">Relevance</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="reviews">Most Reviews</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-300">
                {filteredExperts.length} expert{filteredExperts.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredExperts.map((expert) => (
                <div key={expert.id} className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {expert.image}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">${expert.price}</div>
                      <div className="text-sm text-gray-400">{expert.duration}</div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-1">{expert.name}</h3>
                  <p className="text-gray-300 mb-2">{expert.title}</p>
                  <p className="text-sm text-gray-400 mb-3">{expert.company}</p>

                  <div className="flex items-center mb-3">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-white ml-1">{expert.rating}</span>
                    <span className="text-gray-400 ml-1">({expert.reviews} reviews)</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-400 mb-4">
                    <MapPin className="h-4 w-4 mr-1" />
                    {expert.location}
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {expert.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {expert.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                          +{expert.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/expert/${expert.id}`}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-center block flex items-center justify-center"
                  >
                    View Profile
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              ))}
            </div>

            {filteredExperts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No experts found</h3>
                <p className="text-gray-300">Try adjusting your search criteria or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 