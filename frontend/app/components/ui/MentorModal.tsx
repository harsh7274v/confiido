import React from 'react';
import { X, Star, MessageSquare, Calendar, MapPin, Globe, Award } from 'lucide-react';

interface Mentor {
  id: string;
  name: string;
  image: string;
  title: string;
  company: string;
  location: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  expertise: string[];
  bio: string;
  experience: string;
  languages: string[];
  availability: string;
}

interface MentorModalProps {
  mentor: Mentor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MentorModal({ mentor, isOpen, onClose }: MentorModalProps) {
  if (!mentor) return null;

  return (
    <>
             {/* Modal */}
       <div 
         className={`fixed top-4 right-8 h-[calc(100vh-2rem)] w-full md:w-[520px] bg-white/95 backdrop-blur-md shadow-2xl z-50 transform transition-transform duration-300 ease-in-out rounded-2xl border border-gray-200/30 ${
           isOpen ? 'translate-x-0' : 'translate-x-full'
         }`}
       >
                 {/* Header */}
         <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/90 to-purple-50/90 backdrop-blur-sm rounded-t-2xl">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
             <h2 className="text-xl font-bold text-gray-600">{mentor.name}</h2>
           </div>
           <button
             onClick={onClose}
             className="p-2 hover:bg-gray-100/80 rounded-full transition-all duration-200 hover:scale-110"
           >
             <X className="h-5 w-5 text-gray-500" />
           </button>
         </div>

                          {/* Content */}
         <div className="p-6 overflow-y-auto h-full bg-gradient-to-b from-white/70 to-gray-50/50 backdrop-blur-sm scrollbar-hide">
           {/* Top Section - Image, Basic Info, and Price */}
           <div className="flex items-start gap-6 mb-6">
             {/* Left - Image and Basic Info */}
             <div className="flex-shrink-0">
               <div className="relative inline-block">
                 <img 
                   src={mentor.image} 
                   alt={mentor.name}
                   className="w-24 h-24 rounded-2xl object-cover border-4 border-gradient-to-br from-blue-200 to-purple-200 shadow-lg"
                 />
                 <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                   <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                 </div>
               </div>
             </div>
             
             {/* Center - Name, Title, Company, Rating */}
             <div className="flex-1 min-w-0">
               <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">{mentor.name}</h3>
               <p className="text-gray-600 mb-1 font-medium text-sm">{mentor.title}</p>
               <p className="text-xs text-gray-500 mb-2">{mentor.company}</p>
               
               {/* Rating */}
               <div className="flex items-center gap-2 mb-3">
                 <div className="flex items-center gap-1">
                   {[...Array(5)].map((_, i) => (
                     <Star 
                       key={i} 
                       className={`h-3 w-3 ${i < mentor.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                     />
                   ))}
                 </div>
                 <span className="text-xs text-gray-600">({mentor.reviews} reviews)</span>
               </div>
               
               {/* Location */}
               <div className="flex items-center gap-2">
                 <MapPin className="h-4 w-4 text-blue-500" />
                 <span className="text-sm text-gray-700 font-medium">{mentor.location}</span>
               </div>
             </div>
             
             {/* Right - Price */}
             <div className="flex-shrink-0">
               <div className="bg-gradient-to-r from-blue-50/90 to-purple-50/90 backdrop-blur-sm rounded-xl p-3 border border-blue-200/50 shadow-sm text-center">
                 <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">₹{mentor.hourlyRate}</p>
                 <p className="text-xs text-gray-600 font-medium">per hour</p>
               </div>
             </div>
           </div>

                                {/* Experience and Bio Row */}
           <div className="grid grid-cols-2 gap-4 mb-6">
             {/* Experience */}
             <div className="p-3 bg-gradient-to-r from-blue-50/60 to-purple-50/60 rounded-xl border border-blue-100/50">
               <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                 <Award className="h-4 w-4 text-blue-500" />
                 Experience
               </h4>
               <p className="text-gray-700 font-medium text-sm">{mentor.experience}</p>
             </div>
             
             {/* Bio */}
             <div className="p-3 bg-gradient-to-r from-orange-50/60 to-yellow-50/60 rounded-xl border border-orange-100/50">
               <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                 <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                 About
               </h4>
               <p className="text-gray-700 leading-relaxed font-medium text-sm line-clamp-3">{mentor.bio}</p>
             </div>
           </div>

                                {/* Expertise and Languages Row */}
           <div className="grid grid-cols-2 gap-4 mb-6">
             {/* Expertise */}
             <div className="p-3 bg-gradient-to-r from-purple-50/60 to-pink-50/60 rounded-xl border border-purple-100/50">
               <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                 <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                 Expertise
               </h4>
               <div className="flex flex-wrap gap-1">
                                {mentor.expertise.map((skill, index) => (
                   <span 
                     key={index}
                     className="px-2 py-1 bg-gradient-to-r from-purple-100/80 to-pink-100/80 backdrop-blur-sm text-purple-700 rounded-lg text-xs font-medium border border-purple-200/50"
                   >
                     {skill}
                   </span>
                 ))}
               </div>
             </div>
             
             {/* Languages */}
             <div className="p-3 bg-gradient-to-r from-green-50/60 to-emerald-50/60 rounded-xl border border-green-100/50">
               <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                 <Globe className="h-4 w-4 text-green-500" />
                 Languages
               </h4>
               <div className="flex flex-wrap gap-1">
                                {mentor.languages.map((language, index) => (
                   <span 
                     key={index}
                     className="px-2 py-1 bg-gradient-to-r from-green-100/80 to-emerald-100/80 backdrop-blur-sm text-green-700 rounded-lg text-xs font-medium border border-green-200/50"
                   >
                     {language}
                   </span>
                 ))}
               </div>
             </div>
           </div>

                                {/* Availability */}
           <div className="mb-6 p-3 bg-gradient-to-r from-indigo-50/60 to-blue-50/60 rounded-xl border border-indigo-100/50">
             <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
               <Calendar className="h-4 w-4 text-indigo-500" />
               Availability
             </h4>
             <p className="text-gray-700 font-medium text-sm">{mentor.availability}</p>
           </div>

                     {/* Action Buttons */}
           <div className="grid grid-cols-2 gap-3">
             <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm">
               <Calendar className="h-4 w-4" />
               Book Session
             </button>
             <button className="border-2 border-gradient-to-r from-blue-600 to-purple-600 text-blue-600 py-3 px-4 rounded-xl font-semibold hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 flex items-center justify-center gap-2 bg-white/80 backdrop-blur-sm hover:scale-[1.02] text-sm">
               <MessageSquare className="h-4 w-4" />
               Send Message
             </button>
           </div>
        </div>
      </div>
    </>
  );
}
