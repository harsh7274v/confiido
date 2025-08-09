'use client';

import { useState, useEffect } from 'react';
import { Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const [selectedService, setSelectedService] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [expertId, setExpertId] = useState<string>('');

  useEffect(() => {
    params.then(({ id }) => setExpertId(id));
  }, [params]);
  const [step, setStep] = useState(1);

  // Mock data
  const expert = {
    id: expertId,
    name: "Sarah Chen",
    title: "Product Strategy Consultant",
    avatar: "/avatars/sarah.jpg"
  };

  const services = [
    {
      id: 1,
      title: "Product Strategy Review",
      description: "Comprehensive review of your product strategy with actionable recommendations",
      duration: "30 min",
      price: "$150"
    },
    {
      id: 2,
      title: "Go-to-Market Planning",
      description: "Help you develop a solid go-to-market strategy for your product",
      duration: "45 min",
      price: "$200"
    },
    {
      id: 3,
      title: "User Research Consultation",
      description: "Guide you through effective user research methods and analysis",
      duration: "30 min",
      price: "$150"
    }
  ];

  const availableDates = [
    { date: "2024-01-22", day: "Monday" },
    { date: "2024-01-23", day: "Tuesday" },
    { date: "2024-01-24", day: "Wednesday" },
    { date: "2024-01-25", day: "Thursday" },
    { date: "2024-01-26", day: "Friday" },
  ];

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];

  const selectedServiceData = services.find(s => s.id === selectedService);

  const handleNext = () => {
    if (step === 1 && selectedService) {
      setStep(2);
    } else if (step === 2 && selectedDate && selectedTime) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={`/expert/${expertId}`} className="flex items-center text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Profile
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                Sign In
              </Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {step > stepNumber ? <CheckCircle className="h-5 w-5" /> : stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-16">
            <span className={`text-sm ${step >= 1 ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
              Select Service
            </span>
            <span className={`text-sm ${step >= 2 ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
              Choose Time
            </span>
            <span className={`text-sm ${step >= 3 ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
              Confirm Booking
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Select a Service</h2>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedService === service.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-1">{service.title}</h3>
                            <p className="text-sm text-slate-600 mb-2">{service.description}</p>
                            <div className="flex items-center text-sm text-slate-500">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{service.duration}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-slate-900">{service.price}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Choose Date & Time</h2>
                  
                  {/* Date Selection */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Date</h3>
                    <div className="grid grid-cols-5 gap-3">
                      {availableDates.map((date) => (
                        <div
                          key={date.date}
                          className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${
                            selectedDate === date.date
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => setSelectedDate(date.date)}
                        >
                          <div className="text-sm font-medium text-slate-900">{date.day}</div>
                          <div className="text-xs text-slate-500">{date.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Time</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {timeSlots.map((time) => (
                          <div
                            key={time}
                            className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${
                              selectedTime === time
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                            onClick={() => setSelectedTime(time)}
                          >
                            <div className="text-sm font-medium text-slate-900">{time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Confirm Your Booking</h2>
                  <div className="space-y-6">
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-900 mb-2">Session Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Service:</span>
                          <span className="text-slate-900">{selectedServiceData?.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Duration:</span>
                          <span className="text-slate-900">{selectedServiceData?.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Date:</span>
                          <span className="text-slate-900">{selectedDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Time:</span>
                          <span className="text-slate-900">{selectedTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Price:</span>
                          <span className="text-slate-900 font-semibold">{selectedServiceData?.price}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-900 mb-2">What to Expect</h3>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li>• You&apos;ll receive a calendar invite with video call details</li>
                        <li>• You can share context and questions before the session</li>
                        <li>• The session will be recorded (with your permission)</li>
                        <li>• You can reschedule up to 24 hours before the session</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <div className="ml-auto">
                  {step < 3 ? (
                    <button
                      onClick={handleNext}
                      disabled={
                        (step === 1 && !selectedService) ||
                        (step === 2 && (!selectedDate || !selectedTime))
                      }
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Continue
                    </button>
                  ) : (
                    <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Confirm Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Expert</h3>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {expert.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-medium text-slate-900">{expert.name}</div>
                  <div className="text-sm text-slate-600">{expert.title}</div>
                </div>
              </div>

              {selectedServiceData && (
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-medium text-slate-900 mb-2">Selected Service</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Service:</span>
                      <span className="text-slate-900">{selectedServiceData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Duration:</span>
                      <span className="text-slate-900">{selectedServiceData.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Price:</span>
                      <span className="text-slate-900 font-semibold">{selectedServiceData.price}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDate && selectedTime && (
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <h4 className="font-medium text-slate-900 mb-2">Selected Time</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date:</span>
                      <span className="text-slate-900">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Time:</span>
                      <span className="text-slate-900">{selectedTime}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 