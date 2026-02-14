'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Plus, Edit, Trash2, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { availabilityApi, type TimeSlot, type AvailabilityPeriod } from '../../services/availabilityApi';

const AvailabilityManager: React.FC = () => {
  const [availabilityPeriods, setAvailabilityPeriods] = useState<AvailabilityPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    dateRange: {
      startDate: '',
      endDate: ''
    },
    timeSlots: availabilityApi.generateWeeklyTimeSlots(),
    notes: ''
  });

  const loadAvailabilities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await availabilityApi.getAvailability();
      console.log('🔍 [FRONTEND] Loaded availabilities:', response.data);
      console.log('🔍 [FRONTEND] Availability array:', response.data.availability);
      console.log('🔍 [FRONTEND] Array length:', response.data.availability?.length);
      setAvailabilityPeriods(response.data.availability);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string; message?: string }; status?: number }; message?: string };
      console.error('❌ [FRONTEND] Error loading availabilities:', error);

      // Don't show error for rate limiting, just log it
      if (err.response?.status === 429) {
        console.warn('⚠️ Rate limit reached, skipping this refresh');
      } else {
        setError('Failed to load availability: ' + (err.response?.data?.error || err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailabilities();
  }, [loadAvailabilities]);

  // Auto-refresh availability every 5 minutes (reduced frequency)
  useEffect(() => {
    const interval = setInterval(() => {
      loadAvailabilities();
    }, 300000); // Refresh every 5 minutes instead of 30 seconds

    return () => clearInterval(interval);
  }, [loadAvailabilities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    console.log('🔍 [FRONTEND] Form submitted with data:', formData);

    try {
      // Validate form data
      if (!formData.dateRange.startDate || !formData.dateRange.endDate) {
        setError('Please select both start and end dates');
        return;
      }

      if (!availabilityApi.validateDateRange(formData.dateRange.startDate, formData.dateRange.endDate)) {
        setError('Invalid date range. Start date must be today or later, and end date must be after start date.');
        return;
      }

      // Validate time slots
      for (const slot of formData.timeSlots) {
        if (slot.isAvailable && !availabilityApi.validateTimeSlot(slot)) {
          setError(`Invalid time slot for ${availabilityApi.getDayName(slot.dayOfWeek)}. End time must be after start time.`);
          return;
        }
      }

      console.log('✅ [FRONTEND] Validation passed, calling API...');
      setLoading(true);

      // Convert dates to ISO format for backend
      const apiData = {
        ...formData,
        dateRange: {
          startDate: new Date(formData.dateRange.startDate).toISOString(),
          endDate: new Date(formData.dateRange.endDate).toISOString()
        }
      };

      console.log('🔍 [FRONTEND] Sending API data with ISO dates:', apiData);

      if (editingId) {
        // Update existing availability
        console.log('🔄 [FRONTEND] Updating availability...');
        await availabilityApi.updateAvailability(editingId, apiData);
        setSuccess('Availability updated successfully!');
      } else {
        // Create new availability
        console.log('➕ [FRONTEND] Creating new availability...');
        const result = await availabilityApi.createAvailability(apiData);
        console.log('✅ [FRONTEND] API result:', result);
        setSuccess('Availability created successfully!');
      }

      // Reset form and reload data
      resetForm();
      await loadAvailabilities();

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      setError(err.response?.data?.error || err.message || 'Failed to save availability');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (period: AvailabilityPeriod) => {
    setEditingId(period._id);
    setFormData({
      dateRange: {
        startDate: period.dateRange.startDate.split('T')[0],
        endDate: period.dateRange.endDate.split('T')[0]
      },
      timeSlots: period.timeSlots,
      notes: period.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this availability?')) return;

    console.log('🔍 [FRONTEND] Deleting availability period with ID:', id);

    try {
      setLoading(true);
      const result = await availabilityApi.deleteAvailability(id);
      console.log('✅ [FRONTEND] Delete result:', result);
      setSuccess('Availability deleted successfully!');
      await loadAvailabilities();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string };
      console.error('❌ [FRONTEND] Error deleting availability:', error);
      setError('Failed to delete availability: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      dateRange: { startDate: '', endDate: '' },
      timeSlots: availabilityApi.generateWeeklyTimeSlots(),
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const updateTimeSlot = (dayOfWeek: number, field: keyof TimeSlot, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map(slot =>
        slot.dayOfWeek === dayOfWeek ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const toggleDayAvailability = (dayOfWeek: number) => {
    updateTimeSlot(dayOfWeek, 'isAvailable', !formData.timeSlots.find(s => s.dayOfWeek === dayOfWeek)?.isAvailable);
  };

  if (loading && availabilityPeriods.length === 0) {
    return (
      <div className="py-12 text-center text-gray-600">
        Loading availability...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#fadde1] p-6 rounded-xl border border-white/50 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[#4A4458]" style={{ fontFamily: "'Rubik', sans-serif" }}>Manage Availability</h2>
          <p className="text-gray-700 mt-1" style={{ fontFamily: "'Rubik', sans-serif" }}>Set your available dates and time slots for mentoring sessions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          style={{ backgroundColor: '#3a3a3a', fontFamily: "'Rubik', sans-serif" }}
        >
          <Plus className="h-4 w-4" />
          Add Availability
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-green-700" style={{ fontFamily: "'Rubik', sans-serif" }}>
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-700" style={{ fontFamily: "'Rubik', sans-serif" }}>
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Availability Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-[#4A4458]" style={{ fontFamily: "'Rubik', sans-serif" }}>
              {editingId ? 'Edit Availability' : 'Add New Availability'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 transistion-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Rubik', sans-serif" }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.dateRange.startDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, startDate: e.target.value }
                  }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Rubik', sans-serif" }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.dateRange.endDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, endDate: e.target.value }
                  }))}
                  min={formData.dateRange.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                  required
                />
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>
                Weekly Schedule
              </label>
              <div className="space-y-3">
                {formData.timeSlots.map((slot) => (
                  <div key={slot.dayOfWeek} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={slot.isAvailable}
                        onChange={() => toggleDayAvailability(slot.dayOfWeek)}
                        className="h-4 w-4 text-[#3a3a3a] focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <span className="w-20 text-sm font-medium text-gray-700" style={{ fontFamily: "'Rubik', sans-serif" }}>
                        {availabilityApi.getDayName(slot.dayOfWeek)}
                      </span>
                    </div>

                    {slot.isAvailable && (
                      <>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <select
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(slot.dayOfWeek, 'startTime', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:border-purple-400 focus:outline-none"
                            style={{ fontFamily: "'Rubik', sans-serif" }}
                          >
                            {availabilityApi.generateTimeOptions().map(time => (
                              <option key={time} value={time}>{availabilityApi.formatTime(time)}</option>
                            ))}
                          </select>
                          <span className="text-gray-500">to</span>
                          <select
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(slot.dayOfWeek, 'endTime', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:border-purple-400 focus:outline-none"
                            style={{ fontFamily: "'Rubik', sans-serif" }}
                          >
                            {availabilityApi.generateTimeOptions().map(time => (
                              <option key={time} value={time}>{availabilityApi.formatTime(time)}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "'Rubik', sans-serif" }}>
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                placeholder="Any additional notes about your availability..."
                maxLength={500}
                style={{ fontFamily: "'Rubik', sans-serif" }}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "'Rubik', sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all shadow-md flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                style={{ backgroundColor: '#3a3a3a', fontFamily: "'Rubik', sans-serif" }}
              >
                {loading ? (
                  <>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingId ? 'Update' : 'Save'} Availability
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Availabilities */}
      {availabilityPeriods.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#4A4458]" style={{ fontFamily: "'Rubik', sans-serif" }}>Current Availability</h3>
          {availabilityPeriods
            .filter((period: AvailabilityPeriod) => period.isActive)
            .map((period: AvailabilityPeriod) => (
              <div key={period._id} className="rounded-xl border border-white/50 p-6 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: '#fadde1' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Calendar className="h-5 w-5 text-[#3a3a3a]" />
                      </div>
                      <span className="font-medium text-[#4A4458] text-lg" style={{ fontFamily: "'Rubik', sans-serif" }}>
                        {new Date(period.dateRange.startDate).toLocaleDateString()} - {new Date(period.dateRange.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    {period.notes && (
                      <p className="text-sm text-gray-600 ml-1" style={{ fontFamily: "'Rubik', sans-serif" }}>{period.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(period)}
                      className="text-gray-600 hover:text-gray-900 p-2 hover:bg-white/50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(period._id)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Time Slots Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {period.timeSlots
                    .filter((slot: TimeSlot) => slot.isAvailable)
                    .map((slot: TimeSlot) => (
                      <div key={slot.dayOfWeek} className="flex items-center gap-2 text-sm text-gray-700 bg-white/60 p-2 rounded-lg border border-white/40">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="font-medium" style={{ fontFamily: "'Rubik', sans-serif" }}>{availabilityApi.getShortDayName(slot.dayOfWeek)}:</span>
                        <span style={{ fontFamily: "'Rubik', sans-serif" }}>{availabilityApi.formatTime(slot.startTime)} - {availabilityApi.formatTime(slot.endTime)}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Empty State */}
      {availabilityPeriods.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm">
          <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-[#3a3a3a]" />
          </div>
          <h3 className="text-lg font-medium text-[#4A4458] mb-2" style={{ fontFamily: "'Rubik', sans-serif" }}>No availability set</h3>
          <p className="text-gray-600 mb-4" style={{ fontFamily: "'Rubik', sans-serif" }}>Set your availability to start receiving booking requests from students.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-white px-6 py-2.5 rounded-xl hover:shadow-lg transition-all shadow-md hover:-translate-y-0.5"
            style={{ backgroundColor: '#3a3a3a', fontFamily: "'Rubik', sans-serif" }}
          >
            Set Availability
          </button>
        </div>
      )}
    </div>
  );
};

export default AvailabilityManager;
