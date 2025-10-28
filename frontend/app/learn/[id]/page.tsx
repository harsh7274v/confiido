'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Play, CheckCircle, Lock, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

interface Lesson {
  _id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl?: string;
  isCompleted?: boolean;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  duration?: number;
  lessons: Lesson[];
}

interface Enrollment {
  _id: string;
  courseId: string;
  userId: string;
  progress: number;
  completedLessons: string[];
}

export default function LearnPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseAndEnrollment();
  }, [courseId]);

  const fetchCourseAndEnrollment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Fetch course
      const courseResponse = await fetch(`/api/courses/${courseId}`);
      const courseData = await courseResponse.json();
      
      if (courseData.success) {
        setCourse(courseData.data);
      }

      // Fetch enrollment
      const enrollmentResponse = await fetch('/api/enrollments/my-courses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const enrollmentData = await enrollmentResponse.json();
      
      if (enrollmentData.success) {
        const userEnrollment = enrollmentData.data.enrollments.find(
          (e: { courseId: { _id: string } }) => e.courseId._id === courseId
        );
        setEnrollment(userEnrollment);
        
        if (userEnrollment && courseData.success) {
          // Set current lesson
          const lessons = courseData.data.lessons;
          const currentLessonIndex = userEnrollment.currentLesson 
            ? lessons.findIndex((l: Lesson) => l._id === userEnrollment.currentLesson)
            : 0;
          setCurrentLesson(lessons[currentLessonIndex] || lessons[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!enrollment) return;

    try {
      const token = localStorage.getItem('token');
      const completedLessons = [...(enrollment.completedLessons || []), lessonId];
      
      const response = await fetch(`/api/enrollments/${enrollment._id}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          completedLessons,
          currentLesson: lessonId
        })
      });

      const data = await response.json();
      if (data.success) {
        setEnrollment(data.data);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return enrollment?.completedLessons?.includes(lessonId);
  };

  const isLessonUnlocked = (lessonIndex: number) => {
    if (lessonIndex === 0) return true;
    const previousLesson = course?.lessons[lessonIndex - 1];
    return previousLesson && isLessonCompleted(previousLesson._id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading course...</p>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Course not found or not enrolled</h1>
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
              <span className="text-gray-400">Progress: {enrollment.progress}%</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-screen">
        {/* Video Player */}
        <div className="flex-1 bg-gray-900">
          <div className="h-full flex flex-col">
            <div className="flex-1 bg-black flex items-center justify-center">
              {currentLesson ? (
                <div className="w-full max-w-4xl mx-auto p-4">
                  <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-16 w-16 text-white mx-auto mb-4" />
                      <h2 className="text-xl font-semibold text-white mb-2">
                        {currentLesson.title}
                      </h2>
                      <p className="text-gray-400">
                        {currentLesson.description}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <p>Select a lesson to start learning</p>
                </div>
              )}
            </div>
            
            {/* Lesson Navigation */}
            <div className="p-4 bg-gray-900 border-t border-gray-800">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <button
                  onClick={() => {
                    const currentIndex = course.lessons.findIndex((l: Lesson) => l._id === currentLesson?._id);
                    if (currentIndex > 0) {
                      setCurrentLesson(course.lessons[currentIndex - 1]);
                    }
                  }}
                  disabled={course.lessons.findIndex((l: Lesson) => l._id === currentLesson?._id) === 0}
                  className="flex items-center text-white hover:text-red-500 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>
                
                <div className="flex items-center space-x-4">
                  <span className="text-white text-sm">
                    {course.lessons.findIndex((l: Lesson) => l._id === currentLesson?._id) + 1} of {course.lessons.length}
                  </span>
                  {currentLesson && !isLessonCompleted(currentLesson._id) && (
                    <button
                      onClick={() => markLessonComplete(currentLesson._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    const currentIndex = course.lessons.findIndex((l: Lesson) => l._id === currentLesson?._id);
                    if (currentIndex < course.lessons.length - 1) {
                      setCurrentLesson(course.lessons[currentIndex + 1]);
                    }
                  }}
                  disabled={course.lessons.findIndex((l: Lesson) => l._id === currentLesson?._id) === course.lessons.length - 1}
                  className="flex items-center text-white hover:text-red-500 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content Sidebar */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          <div className="p-4">
            <div className="mb-6">
              <Link href="/courses" className="flex items-center text-gray-400 hover:text-white transition-colors mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Link>
              <h1 className="text-xl font-bold text-white mb-2">{course.title}</h1>
              <div className="flex items-center text-sm text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                {course.duration 
                  ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}m`
                  : 'Duration not specified'
                }
              </div>
            </div>

            <div className="space-y-2">
              {course.lessons.map((lesson: Lesson, index: number) => (
                <button
                  key={lesson._id}
                  onClick={() => setCurrentLesson(lesson)}
                  disabled={!isLessonUnlocked(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentLesson?._id === lesson._id
                      ? 'bg-red-600 text-white'
                      : isLessonUnlocked(index)
                      ? 'bg-gray-800 text-white hover:bg-gray-700'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {isLessonCompleted(lesson._id) ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : isLessonUnlocked(index) ? (
                        <Play className="h-4 w-4 text-gray-400 mr-2" />
                      ) : (
                        <Lock className="h-4 w-4 text-gray-500 mr-2" />
                      )}
                      <span className="text-sm font-medium">{lesson.title}</span>
                    </div>
                    <span className="text-xs text-gray-400">{lesson.duration}m</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 