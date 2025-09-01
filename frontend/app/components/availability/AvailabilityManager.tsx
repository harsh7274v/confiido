'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit, Trash2, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { availabilityApi, type TimeSlot, type DateRange, type Availability, type AvailabilityPeriod } from '../../services/availabilityApi';
import LoadingSpinner from '../ui/LoadingSpinner';

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

  useEffect(() => {
    loadAvailabilities();
  }, []);

  const loadAvailabilities = async () => {
    try {
      setLoading(true);
      const response = await availabilityApi.getAvailability();
      console.log('🔍 [FRONTEND] Loaded availabilities:', response.data);
      console.log('🔍 [FRONTEND] Availability array:', response.data.availability);
      console.log('🔍 [FRONTEND] Array length:', response.data.availability?.length);
      setAvailabilityPeriods(response.data.availability);
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error loading availabilities:', error);
      setError('Failed to load availability: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

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
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'Failed to save availability');
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
    } catch (error: any) {
      console.error('❌ [FRONTEND] Error deleting availability:', error);
      setError('Failed to delete availability: ' + (error.response?.data?.error || error.message));
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

  const updateTimeSlot = (dayOfWeek: number, field: keyof TimeSlot, value: any) => {
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
    return <LoadingSpinner size="lg" text="Loading availability..." />;
  }

  return (
    <div className="space-y-6">
             {/* Header */}
       <div className="flex justify-between items-center">
         <div>
           <h2 className="text-2xl font-bold text-gray-900">Manage Availability</h2>
           <p className="text-gray-600">Set your available dates and time slots for mentoring sessions</p>
         </div>
                   <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Availability
          </button>
       </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Availability Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Availability' : 'Add New Availability'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Weekly Schedule
              </label>
              <div className="space-y-3">
                {formData.timeSlots.map((slot) => (
                  <div key={slot.dayOfWeek} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={slot.isAvailable}
                        onChange={() => toggleDayAvailability(slot.dayOfWeek)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="w-20 text-sm font-medium text-gray-700">
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
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {availabilityApi.generateTimeOptions().map(time => (
                              <option key={time} value={time}>{availabilityApi.formatTime(time)}</option>
                            ))}
                          </select>
                          <span className="text-gray-500">to</span>
                          <select
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(slot.dayOfWeek, 'endTime', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes about your availability..."
                maxLength={500}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving...
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
          <h3 className="text-lg font-semibold text-gray-900">Current Availability</h3>
          {availabilityPeriods
            .filter((period: AvailabilityPeriod) => period.isActive)
            .map((period: AvailabilityPeriod) => (
              <div key={period._id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {new Date(period.dateRange.startDate).toLocaleDateString()} - {new Date(period.dateRange.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    {period.notes && (
                      <p className="text-sm text-gray-600">{period.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(period)}
                      className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(period._id)}
                      className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
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
                      <div key={slot.dayOfWeek} className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">{availabilityApi.getShortDayName(slot.dayOfWeek)}:</span>
                        <span>{availabilityApi.formatTime(slot.startTime)} - {availabilityApi.formatTime(slot.endTime)}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Empty State */}
      {availabilityPeriods.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No availability set</h3>
          <p className="text-gray-600 mb-4">Set your availability to start receiving booking requests from students.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Set Availability
          </button>
        </div>
      )}
    </div>
  );
};

export default AvailabilityManager;
