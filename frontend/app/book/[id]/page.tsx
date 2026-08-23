'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Clock, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import expertsApi from '../../services/expertsApi';

interface ServiceOption {
  id: number;
  title: string;
  description: string;
  duration: string;
  price: string;
}

interface DateOption {
  date: string;
  day: string;
}

interface ExpertInfo {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  hourlyRate?: number;
}

// ----------------------------------------------------------------------
// Modular Sub-Components (using Fragments instead of redundant divs)
// ----------------------------------------------------------------------

const BookingNavigation = ({ expertId }: { expertId: string }) => (
  <nav className="bg-white border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <Link
          href={expertId ? `/expert/${expertId}` : '/search'}
          className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Profile
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-slate-600 hover:text-slate-900 transition-colors">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  </nav>
);

const BookingStepIndicator = ({ step }: { step: number }) => (
  <div className="mb-8">
    <div className="flex items-center justify-center space-x-8">
      {[1, 2, 3].map((stepNumber) => (
        <Fragment key={stepNumber}>
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= stepNumber
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-600'
                }`}
            >
              {step > stepNumber ? <CheckCircle className="h-5 w-5" /> : stepNumber}
            </div>
            {stepNumber < 3 && (
              <div
                className={`w-16 h-0.5 mx-4 transition-colors ${step > stepNumber ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
              />
            )}
          </div>
        </Fragment>
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
);

const ServiceSelectionStep = ({
  services,
  selectedService,
  onSelectService,
}: {
  services: ServiceOption[];
  selectedService: number;
  onSelectService: (id: number) => void;
}) => (
  <Fragment>
    <h2 className="text-2xl font-bold text-slate-900 mb-6">Select a Service</h2>
    <div className="space-y-4">
      {services.map((service) => (
        <div
          key={service.id}
          className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedService === service.id
              ? 'border-blue-600 bg-blue-50'
              : 'border-slate-200 hover:border-slate-300'
            }`}
          onClick={() => onSelectService(service.id)}
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
  </Fragment>
);

const TimeSelectionStep = ({
  availableDates,
  selectedDate,
  onSelectDate,
  timeSlots,
  selectedTime,
  onSelectTime,
}: {
  availableDates: DateOption[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  timeSlots: string[];
  selectedTime: string;
  onSelectTime: (time: string) => void;
}) => (
  <Fragment>
    <h2 className="text-2xl font-bold text-slate-900 mb-6">Choose Date &amp; Time</h2>

    {/* Date Selection */}
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Date</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {availableDates.map((dateObj) => (
          <div
            key={dateObj.date}
            className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${selectedDate === dateObj.date
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
              }`}
            onClick={() => onSelectDate(dateObj.date)}
          >
            <div className="text-sm font-medium text-slate-900">{dateObj.day}</div>
            <div className="text-xs text-slate-500">{dateObj.date}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Time Selection */}
    {selectedDate && (
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Time</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {timeSlots.map((time) => (
            <div
              key={time}
              className={`border rounded-lg p-3 text-center cursor-pointer transition-colors ${selectedTime === time
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
                }`}
              onClick={() => onSelectTime(time)}
            >
              <div className="text-sm font-medium text-slate-900">{time}</div>
            </div>
          ))}
        </div>
      </div>
    )}
  </Fragment>
);

const BookingConfirmationStep = ({
  selectedServiceData,
  selectedDate,
  selectedTime,
}: {
  selectedServiceData?: ServiceOption;
  selectedDate: string;
  selectedTime: string;
}) => (
  <Fragment>
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
  </Fragment>
);

const ExpertSidebar = ({
  expert,
  selectedServiceData,
  selectedDate,
  selectedTime,
}: {
  expert: ExpertInfo | null;
  selectedServiceData?: ServiceOption;
  selectedDate: string;
  selectedTime: string;
}) => {
  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Expert</h3>
      {expert && (
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {getInitials(expert.name)}
          </div>
          <div>
            <div className="font-medium text-slate-900">{expert.name}</div>
            <div className="text-sm text-slate-600">{expert.title}</div>
          </div>
        </div>
      )}

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
  );
};

// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const [expertId, setExpertId] = useState<string>('');
  const [expert, setExpert] = useState<ExpertInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedService, setSelectedService] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [step, setStep] = useState<number>(1);

  // Dynamic Date Generator for Next 7 Days
  const generateAvailableDates = (): DateOption[] => {
    const dates: DateOption[] = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();

    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      const dateStr = nextDate.toISOString().split('T')[0];
      const dayStr = days[nextDate.getDay()];
      dates.push({ date: dateStr, day: dayStr });
    }
    return dates;
  };

  const availableDates = generateAvailableDates();
  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

  // Dynamic Service Options based on Expert Hourly Rate
  const getServicesForExpert = (rate: number = 150): ServiceOption[] => [
    {
      id: 1,
      title: '1-on-1 Consultation Session',
      description: 'Comprehensive 1-on-1 session with actionable advice and recommendations',
      duration: '30 min',
      price: `₹${Math.round(rate / 2)}`,
    },
    {
      id: 2,
      title: 'Extended Strategy & Planning',
      description: 'Deep-dive strategy session to develop a solid roadmap for your goals',
      duration: '60 min',
      price: `₹${rate}`,
    },
    {
      id: 3,
      title: 'Quick Q&A & Advisory',
      description: 'Targeted consultation for specific questions and rapid feedback',
      duration: '15 min',
      price: `₹${Math.round(rate / 4)}`,
    },
  ];

  // Fetch Real Expert Data from API
  useEffect(() => {
    let isMounted = true;
    params.then(({ id }) => {
      if (!isMounted) return;
      setExpertId(id);
      if (id) {
        setIsLoading(true);
        expertsApi
          .getExpertById(id)
          .then((res) => {
            if (!isMounted) return;
            if (res.success && res.data?.expert) {
              const exp = res.data.expert;
              const firstName = exp.userId?.firstName || 'Expert';
              const lastName = exp.userId?.lastName || '';
              setExpert({
                id: exp._id || id,
                name: `${firstName} ${lastName}`.trim(),
                title: exp.title || exp.company || 'Domain Consultant',
                avatar: exp.userId?.avatar,
                hourlyRate: exp.hourlyRate || 150,
              });
            } else {
              setExpert({
                id,
                name: 'Expert Consultant',
                title: 'Domain Expert',
                hourlyRate: 150,
              });
            }
          })
          .catch(() => {
            if (!isMounted) return;
            setExpert({
              id,
              name: 'Expert Consultant',
              title: 'Domain Expert',
              hourlyRate: 150,
            });
          })
          .finally(() => {
            if (isMounted) setIsLoading(false);
          });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [params]);

  const services = getServicesForExpert(expert?.hourlyRate);
  const selectedServiceData = services.find((s) => s.id === selectedService);

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
    <Fragment>
      <div className="min-h-screen bg-slate-50">
        <BookingNavigation expertId={expertId} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BookingStepIndicator step={step} />

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-2" />
              <span className="text-slate-600 font-medium">Loading Expert Details...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  {step === 1 && (
                    <ServiceSelectionStep
                      services={services}
                      selectedService={selectedService}
                      onSelectService={setSelectedService}
                    />
                  )}

                  {step === 2 && (
                    <TimeSelectionStep
                      availableDates={availableDates}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                      timeSlots={timeSlots}
                      selectedTime={selectedTime}
                      onSelectTime={setSelectedTime}
                    />
                  )}

                  {step === 3 && (
                    <BookingConfirmationStep
                      selectedServiceData={selectedServiceData}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                    />
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
                <ExpertSidebar
                  expert={expert}
                  selectedServiceData={selectedServiceData}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
}