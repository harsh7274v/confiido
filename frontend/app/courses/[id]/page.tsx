'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Play, Clock, Users, Star, CheckCircle, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Lesson {
  _id: string;
  title: string;
  description: string;
  duration: string;
  isCompleted?: boolean;
  isPreview?: boolean;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  duration: string | number;
  studentsCount: number;
  enrollmentCount?: number;
  rating: number;
  reviewsCount: number;
  totalReviews?: number;
  image: string;
  thumbnail?: string;
  instructor: {
    name: string;
    avatar: string;
    bio: string;
  };
  lessons?: Lesson[];
  isEnrolled?: boolean;
}

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const data = await response.json();
      
      if (data.success) {
        setCourse(data.data);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;

    setEnrolling(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: course._id,
          paymentAmount: course.price,
          currency: course.currency
        })
      });

      const data = await response.json();
      
      if (data.success) {
        window.location.href = `/learn/${course._id}`;
      } else {
        alert(data.message || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <video autoPlay loop muted playsInline className="h-16 w-16 object-contain" style={{ pointerEvents: 'none' }}>
          <source src="/spinner.webm" type="video/webm" />
        </video>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Course not found</h1>
          <Link href="/courses" className="text-red-500 hover:text-red-400">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-black/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white">LUMINA</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-white hover:text-red-500 transition-colors">Sign In</Link>
              <Link href="/signup" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/courses" className="flex items-center text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold text-white mb-4">{course.title}</h1>
            <p className="text-xl text-gray-300 mb-6">{course.shortDescription}</p>
            
            <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {typeof course.duration === 'number' 
                  ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}m`
                  : course.duration
                }
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {course.enrollmentCount || course.studentsCount} students
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current mr-2" />
                {course.rating?.toFixed(1) || '0.0'} ({course.totalReviews || 0})
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">About this course</h2>
              <p className="text-gray-300 leading-relaxed">{course.description}</p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Course curriculum</h2>
              <div className="bg-gray-900 rounded-lg border border-gray-800">
                {course.lessons?.map((lesson: Lesson, index: number) => (
                  <div key={lesson._id} className="flex items-center justify-between p-4 border-b border-gray-800 last:border-b-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white text-sm font-semibold">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{lesson.title}</h3>
                        <p className="text-gray-400 text-sm">{lesson.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 text-sm">{lesson.duration}m</span>
                      {lesson.isPreview ? (
                        <Play className="h-5 w-5 text-green-500" />
                      ) : (
                        <Lock className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <div className="relative mb-4">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-white">
                    ${course.price}
                  </span>
                  {course.originalPrice && course.originalPrice > course.price && (
                    <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-semibold">
                      {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
                    </span>
                  )}
                </div>

                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center mb-4 disabled:opacity-50"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {course.lessons?.length || 0} lessons
                  </div>
                  <div className="flex items-center text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Certificate of completion
                  </div>
                  <div className="flex items-center text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Lifetime access
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 