'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Play, Clock, Users, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Course {
  _id: string;
  title: string;
  shortDescription: string;
  price: number;
  currency: string;
  originalPrice?: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  enrollmentCount: number;
  rating: number;
  totalReviews: number;
  thumbnail: string;
  expertId: {
    title: string;
    company: string;
    rating: number;
    totalReviews: number;
  };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const categories = [
    'All', 'Career', 'Consulting', 'Content', 'Cybersecurity', 'Data & AI', 
    'Design', 'Finance', 'HR', 'Law', 'Marketing', 'Mental Health', 
    'Product', 'Software', 'Study Abroad', 'Supply Chain'
  ];

  const levels = ['All', 'beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedLevel && selectedLevel !== 'All') params.append('level', selectedLevel);

      const response = await fetch(`/api/courses?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="bg-black/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white">LUMINA</Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/courses" className="text-red-500 font-semibold">Courses</Link>
              <Link href="/experts" className="text-white hover:text-red-500 transition-colors">Experts</Link>
              <Link href="/become-expert" className="text-white hover:text-red-500 transition-colors">Join as Expert</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-white hover:text-red-500 transition-colors">Sign In</Link>
              <Link href="/signup" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Learn from Industry Experts
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Access premium courses from verified professionals across all industries
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                onClick={fetchCourses}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Search
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-gray-400">Filter:</span>
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level === 'All' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No courses found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <div key={course._id} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors">
                  {/* Course Thumbnail */}
                  <div className="relative">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                    {course.originalPrice && course.originalPrice > course.price && (
                      <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-sm font-semibold">
                        {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-red-500 font-semibold uppercase tracking-wide">
                        {course.category}
                      </span>
                      <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
                        {course.level}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                      {course.title}
                    </h3>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {course.shortDescription}
                    </p>

                    {/* Expert Info */}
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                        {course.expertId.title.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{course.expertId.title}</p>
                        <p className="text-gray-400 text-xs">{course.expertId.company}</p>
                      </div>
                    </div>

                    {/* Course Stats */}
                    <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDuration(course.duration)}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {course.enrollmentCount} students
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        {course.rating.toFixed(1)} ({course.totalReviews})
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-white">
                          {formatPrice(course.price, course.currency)}
                        </span>
                        {course.originalPrice && course.originalPrice > course.price && (
                          <span className="text-gray-400 line-through ml-2">
                            {formatPrice(course.originalPrice, course.currency)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/courses/${course._id}`}
                      className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      View Course
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
} 