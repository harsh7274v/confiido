import React, { useState, useEffect } from 'react';
import { Select, SelectItem } from './ui/Select';
import { User, Briefcase, Calendar, Phone, MessageCircle, Linkedin, X, Save, LogOut, Sparkles } from 'lucide-react';

interface EditProfilePopupProps {
    onClose: () => void;
    onSave: (profile: ProfileData) => void;
    initialProfile?: ProfileData | null;
}

export interface ProfileData {
        username: string;
        gender: string;
        dateOfBirth: string;
        profession: string;
        phoneNumber: string;
        whatsappNumber: string;
        linkedin: string;
}

const EditProfilePopup: React.FC<EditProfilePopupProps> = ({ onClose, onSave, initialProfile }) => {
    const [profile, setProfile] = useState<ProfileData>(
            initialProfile || {
                username: '',
                gender: '',
                dateOfBirth: '',
                profession: '',
                phoneNumber: '',
                whatsappNumber: '',
                linkedin: '',
            }
    );

    useEffect(() => {
        if (initialProfile) {
            setProfile(initialProfile);
        }
    }, [initialProfile]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setProfile({ ...profile, [e.target.name]: e.target.value });
        };

    const handleSave = async () => {
        try {
            await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003'}/api/users/profile`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ userdata: profile })
                }
            );
            onSave(profile);
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        if (window?.location) {
            window.location.href = '/';
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn pb-20 lg:pb-0 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full relative transition-all duration-300 overflow-hidden border border-gray-200" style={{ maxWidth: '35vw', width: '90%', minWidth: '320px', maxHeight: '90vh' }}>
                {/* Modern Header with Gradient */}
                <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl shadow-lg" style={{ background: '#3E5F44' }}>
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                                Edit Profile
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">Update your personal information</p>
                        </div>
                    </div>
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all duration-200"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Shimmer Animation */}
                <style jsx>{`
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    .animate-shimmer {
                        animation: shimmer 3s ease-in-out infinite;
                    }
                `}</style>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                    <form className="space-y-4">
                        {/* Username & Gender Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="username" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <User className="h-4 w-4 text-gray-500" />
                                    Username
                                </label>
                                <input 
                                    id="username" 
                                    name="username" 
                                    type="text" 
                                    value={profile.username} 
                                    onChange={handleChange} 
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                    placeholder="Enter your username"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="gender" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Sparkles className="h-4 w-4 text-gray-500" />
                                    Gender
                                </label>
                                <Select
                                    value={profile.gender}
                                    onValueChange={(value: string) => setProfile({ ...profile, gender: value })}
                                    className="w-full"
                                    placeholder="Select Gender"
                                >
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                </Select>
                            </div>
                        </div>

                        {/* Profession & Date of Birth Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="profession" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Briefcase className="h-4 w-4 text-gray-500" />
                                    Profession
                                </label>
                                <input 
                                    id="profession" 
                                    name="profession" 
                                    type="text" 
                                    value={profile.profession} 
                                    onChange={handleChange} 
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                    placeholder="Your profession"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="dateOfBirth" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    Date of Birth
                                </label>
                                <input 
                                    id="dateOfBirth" 
                                    name="dateOfBirth" 
                                    type="date" 
                                    value={profile.dateOfBirth} 
                                    onChange={handleChange} 
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                />
                            </div>
                        </div>

                        {/* Phone & WhatsApp Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="phoneNumber" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    Phone Number
                                </label>
                                <input 
                                    id="phoneNumber" 
                                    name="phoneNumber" 
                                    type="tel" 
                                    value={profile.phoneNumber} 
                                    onChange={handleChange} 
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="whatsappNumber" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <MessageCircle className="h-4 w-4 text-gray-500" />
                                    WhatsApp Number
                                </label>
                                <input 
                                    id="whatsappNumber" 
                                    name="whatsappNumber" 
                                    type="tel" 
                                    value={profile.whatsappNumber} 
                                    onChange={handleChange} 
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                        </div>

                        {/* LinkedIn Full Width */}
                        <div className="space-y-2">
                            <label htmlFor="linkedin" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Linkedin className="h-4 w-4 text-gray-500" />
                                LinkedIn Profile
                            </label>
                            <input 
                                id="linkedin" 
                                name="linkedin" 
                                type="text" 
                                value={profile.linkedin} 
                                onChange={handleChange} 
                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                placeholder="https://linkedin.com/in/yourprofile"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95"
                                style={{ backgroundColor: '#3E5F44' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2F4A35'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3E5F44'}
                                onClick={handleSave}
                            >
                                <Save className="h-4 w-4" />
                                Save Profile
                            </button>
                            <button	
                                type="button"
                                className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95"
                                style={{ backgroundColor: '#1a1a1a' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0a0a0a'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePopup;
