import React, { useState } from 'react';
import { Select, SelectItem } from "./ui/Select";

// Generate time slots from 6 AM to 11 PM in 15-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = `${hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
      slots.push({ value: time, label: displayTime });
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

const services = [
  'Career Guidance',
  'Resume Review',
  'Interview Prep',
  'Skill Development',
];
const durations = ['30 min', '60 min', '90 min'];
const mentors = [
  'Priya Sharma',
  'Rahul Verma',
  'Anjali Patel',
];

const BookSessionPopup: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [service, setService] = useState('');
  const [duration, setDuration] = useState('');
  const [mentor, setMentor] = useState('');
  const [date, setDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-md">
  <div className="relative w-full max-w-sm animate-popup-in" style={{ maxWidth: '40vw', width: '80%', minWidth: '0' }}>
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-[#e0e0e0] rounded-t-2xl z-10" />
        <div className="bg-[#f5f5f5] rounded-2xl shadow-2xl flex overflow-hidden border border-[#e0e0e0]" style={{ maxHeight: '90vh' }}>
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-black hover:text-[#e0e0e0] text-xl transition-transform transform hover:scale-125 focus:outline-none z-20"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          {/* Right: Booking Form */}
          <div className="flex-1 p-8 flex flex-col justify-start bg-[#f5f5f5] relative hide-scrollbar" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <div className="mb-2">
              <span className="text-3xl font-extrabold text-black tracking-tight leading-tight drop-shadow">Book a Session</span>
            </div>
            <div className="flex flex-col gap-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Select the Service</label>
                <Select value={service} onValueChange={setService}>
                  {services.map(s => (
                    <SelectItem key={s} value={s} className="text-base">{s}</SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Choose the Duration</label>
                <Select value={duration} onValueChange={setDuration}>
                  {durations.map(d => (
                    <SelectItem key={d} value={d} className="text-base">{d}</SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Select Mentor</label>
                <Select value={mentor} onValueChange={setMentor}>
                  {mentors.map(m => (
                    <SelectItem key={m} value={m} className="text-base">{m}</SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Select Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-[#e0e0e0] bg-white text-black font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Book a Slot</label>
                                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                     <Select value={fromTime} onValueChange={setFromTime} placeholder="Select start time">
                       {timeSlots.map(slot => (
                         <SelectItem key={slot.value} value={slot.value} className="text-base">
                           {slot.label}
                         </SelectItem>
                       ))}
                     </Select>
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                     <Select value={toTime} onValueChange={setToTime} placeholder="Select end time">
                       {timeSlots.map(slot => (
                         <SelectItem key={slot.value} value={slot.value} className="text-base">
                           {slot.label}
                         </SelectItem>
                       ))}
                     </Select>
                   </div>
                 </div>
              </div>
            </div>
            <button className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition text-lg">Book Now</button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .animate-popup-in {
          animation: popup-in 0.5s cubic-bezier(.4,2,.3,1) both;
        }
        @keyframes popup-in {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        /* Use half width for desktop, 80vw for mobile */
        .max-w-sm {
          max-width: 40vw !important;
        }
        @media (max-width: 640px) {
          .max-w-sm {
            max-width: 80vw !important;
          }
        }
        .p-8 {
          padding: 2rem !important;
        }
        .flex-col.gap-4 > div {
          margin-bottom: 1rem !important;
        }
        .text-base {
          font-size: 1rem !important;
        }
        /* Ensure dropdown menus appear directly below the trigger */
        .radix-select-content {
          position: fixed !important;
          left: auto !important;
          right: auto !important;
          min-width: 100% !important;
          width: 100% !important;
          top: auto !important;
          margin-top: 0 !important;
          z-index: 1000 !important;
        }
        
        /* Override for all select dropdowns */
        [data-radix-select-content] {
          position: absolute !important;
          left: 0 !important;
          right: auto !important;
          min-width: 100% !important;
          width: 100% !important;
          top: calc(100% + 2px) !important;
          margin-top: 0 !important;
          z-index: 1000 !important;
        }
        
        /* Specific positioning for time selectors in grid */
        .grid.grid-cols-2 [data-radix-select-content] {
          position: absolute !important;
          left: 0 !important;
          right: auto !important;
          min-width: 100% !important;
          width: 100% !important;
          top: calc(100% + 2px) !important;
          margin-top: 0 !important;
          z-index: 1000 !important;
        }
        
                 /* Force positioning for all select content */
         .radix-select-content,
         [data-radix-select-content],
         [data-radix-popper-content-wrapper] {
           position: absolute !important;
           left: 0 !important;
           right: auto !important;
           min-width: 100% !important;
           width: 100% !important;
           top: calc(100% + 2px) !important;
           margin-top: 0 !important;
           z-index: 1000 !important;
         }
         
                                                                                                                                                               /* Custom positioning for time selectors to align with form height */
             .grid.grid-cols-2 [data-radix-select-content] {
               position: absolute !important;
               left: 0 !important;
               right: auto !important;
               min-width: 100% !important;
               width: 100% !important;
               top: calc(100% - 120px) !important;
               margin-top: 0 !important;
               z-index: 1000 !important;
               max-height: 250px !important;
               min-height: 150px !important;
             }
        
        @media (max-width: 640px) {
          .radix-select-content,
          [data-radix-select-content] {
            min-width: 100% !important;
            width: 100% !important;
          }
        }
          .hide-scrollbar {
          scrollbar-width: none !important; /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important; /* Chrome, Safari */
        }
      `}</style>
    </div>
  );
};

export default BookSessionPopup;
