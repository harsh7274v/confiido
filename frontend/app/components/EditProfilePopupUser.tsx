import React, { useState, useEffect } from 'react';
import { Select, SelectItem } from './ui/Select';
import { User, Briefcase, Calendar, Phone, MessageCircle, Linkedin, X, Save, LogOut, Sparkles, CheckCircle, Star } from 'lucide-react';

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
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showLogoutToast, setShowLogoutToast] = useState(false);

    useEffect(() => {
        if (initialProfile) {
            setProfile(initialProfile);
        }
    }, [initialProfile]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setProfile({ ...profile, [e.target.name]: e.target.value });
        };

    const handleSave = async () => {
        // Check if any data has actually changed
        const hasChanges = initialProfile && (
            profile.username !== initialProfile.username ||
            profile.gender !== initialProfile.gender ||
            profile.dateOfBirth !== initialProfile.dateOfBirth ||
            profile.profession !== initialProfile.profession ||
            profile.phoneNumber !== initialProfile.phoneNumber ||
            profile.whatsappNumber !== initialProfile.whatsappNumber ||
            profile.linkedin !== initialProfile.linkedin
        );

        // If no changes were made, don't save or show toast
        if (!hasChanges) {
            return;
        }

        try {
            const response = await fetch(
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
            
            // Only show success toast if the update was successful
            if (response.ok) {
                onSave(profile);
                
                // Show success toast
                setShowSuccessToast(true);
                
                // Auto-hide toast after 3 seconds
                setTimeout(() => {
                    setShowSuccessToast(false);
                }, 3000);
            } else {
                console.error('Error saving profile: Server returned', response.status);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    };

    const handleLogout = () => {
        // Show logout success toast
        setShowLogoutToast(true);
        
        // Wait for toast to be visible, then logout
        setTimeout(() => {
            localStorage.removeItem('token');
            if (window?.location) {
                window.location.href = '/';
            }
        }, 500);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn pb-20 lg:pb-0 bg-black/30 backdrop-blur-sm">
            {/* Success Toast Notification */}
            {showSuccessToast && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-fadeIn backdrop-blur-sm border border-white/20">
                    <div className="p-2 bg-white/20 rounded-full">
                        <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">Profile Updated!</span>
                        <span className="text-xs opacity-90">Your profile data has been successfully updated</span>
                    </div>
                    <button
                        className="ml-4 text-white/80 hover:text-white focus:outline-none transition-colors"
                        onClick={() => setShowSuccessToast(false)}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Logout Success Toast Notification */}
            {showLogoutToast && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-fadeIn backdrop-blur-sm border border-white/20">
                    <div className="p-2 bg-white/20 rounded-full">
                        <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">Logout Successful!</span>
                        <span className="text-xs opacity-90">Account logged out successfully</span>
                    </div>
                    <button
                        className="ml-4 text-white/80 hover:text-white focus:outline-none transition-colors"
                        onClick={() => setShowLogoutToast(false)}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="shadow-2xl w-full relative transition-all duration-300 overflow-hidden border flex flex-col" style={{ backgroundColor: '#fadde1', borderColor: 'rgba(93, 88, 105, 0.1)', borderRadius: '2.5rem', maxWidth: '35vw', width: '90%', minWidth: '320px', maxHeight: '90vh' }}>
                {/* Modern Header with Dashboard Theme */}
                <div className="relative px-6 py-5 border-b flex-shrink-0" style={{ backgroundColor: '#fadde1', borderColor: 'rgba(93, 88, 105, 0.1)' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 shadow-lg" style={{ backgroundColor: '#3a3a3a', borderRadius: '1.5rem' }}>
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold" style={{ fontFamily: "'Rubik', sans-serif", color: '#5D5869' }}>
                                Edit Profile
                            </h2>
                            <p className="text-xs mt-0.5" style={{ color: '#5D5869', opacity: 0.7 }}>Update your personal information</p>
                        </div>
                    </div>
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full transition-all duration-200"
                        style={{ color: '#5D5869' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(93, 88, 105, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto pb-8 flex-1" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                    <form className="space-y-4">
                        {/* Username & Gender Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="username" className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#5D5869' }}>
                                    <User className="h-4 w-4" style={{ color: '#5D5869', opacity: 0.7 }} />
                                    Username
                                    {(!profile.username || profile.username.trim() === '') && (
                                        <Star className="w-3 h-3 fill-red-500 text-red-500" />
                                    )}
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={profile.username}
                                    onChange={handleChange}
                                    className="w-full border px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                    style={{ borderColor: 'rgba(93, 88, 105, 0.2)', borderRadius: '1rem', backgroundColor: 'white', color: '#000000' }}
                                    placeholder="Enter your username"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="gender" className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#5D5869' }}>
                                    <Sparkles className="h-4 w-4" style={{ color: '#5D5869', opacity: 0.7 }} />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="profession" className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#5D5869' }}>
                                    <Briefcase className="h-4 w-4" style={{ color: '#5D5869', opacity: 0.7 }} />
                                    Profession
                                </label>
                                <input
                                    id="profession"
                                    name="profession"
                                    type="text"
                                    value={profile.profession}
                                    onChange={handleChange}
                                    className="w-full border px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                    style={{ borderColor: 'rgba(93, 88, 105, 0.2)', borderRadius: '1rem', backgroundColor: 'white', color: '#000000' }}
                                    placeholder="Your profession"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="dateOfBirth" className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#5D5869' }}>
                                    <Calendar className="h-4 w-4" style={{ color: '#5D5869', opacity: 0.7 }} />
                                    Date of Birth
                                </label>
                                <input
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={profile.dateOfBirth}
                                    onChange={handleChange}
                                    className="w-full border px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                    style={{ borderColor: 'rgba(93, 88, 105, 0.2)', borderRadius: '1rem', backgroundColor: 'white', color: '#000000' }}
                                />
                            </div>
                        </div>

                        {/* Phone & WhatsApp Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="phoneNumber" className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#5D5869' }}>
                                    <Phone className="h-4 w-4" style={{ color: '#5D5869', opacity: 0.7 }} />
                                    Phone Number
                                    {(!profile.phoneNumber || profile.phoneNumber.trim() === '') && (
                                        <Star className="w-3 h-3 fill-red-500 text-red-500" />
                                    )}
                                </label>
                                <input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="tel"
                                    value={profile.phoneNumber}
                                    onChange={handleChange}
                                    className="w-full border px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                    style={{ borderColor: 'rgba(93, 88, 105, 0.2)', borderRadius: '1rem', backgroundColor: 'white', color: '#000000' }}
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="whatsappNumber" className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#5D5869' }}>
                                    <MessageCircle className="h-4 w-4" style={{ color: '#5D5869', opacity: 0.7 }} />
                                    WhatsApp Number
                                    {(!profile.whatsappNumber || profile.whatsappNumber.trim() === '') && (
                                        <Star className="w-3 h-3 fill-red-500 text-red-500" />
                                    )}
                                </label>
                                <input
                                    id="whatsappNumber"
                                    name="whatsappNumber"
                                    type="tel"
                                    value={profile.whatsappNumber}
                                    onChange={handleChange}
                                    className="w-full border px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                    style={{ borderColor: 'rgba(93, 88, 105, 0.2)', borderRadius: '1rem', backgroundColor: 'white', color: '#000000' }}
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                        </div>

                        {/* LinkedIn Full Width */}
                        <div className="space-y-2">
                            <label htmlFor="linkedin" className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#5D5869' }}>
                                <Linkedin className="h-4 w-4" style={{ color: '#5D5869', opacity: 0.7 }} />
                                LinkedIn Profile
                            </label>
                            <input
                                id="linkedin"
                                name="linkedin"
                                type="text"
                                value={profile.linkedin}
                                onChange={handleChange}
                                className="w-full border px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                                style={{ borderColor: 'rgba(93, 88, 105, 0.2)', borderRadius: '1rem', backgroundColor: 'white', color: '#000000' }}
                                placeholder="https://linkedin.com/in/yourprofile"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 pb-2">
                            <button
                                type="button"
                                className="flex-1 flex items-center justify-center gap-2 text-white py-3 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95"
                                style={{ backgroundColor: '#3a3a3a', borderRadius: '1.5rem' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                                onClick={handleSave}
                            >
                                <Save className="h-4 w-4" />
                                Save Profile
                            </button>
                            <button
                                type="button"
                                className="flex-1 flex items-center justify-center gap-2 text-white py-3 font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-95"
                                style={{ backgroundColor: '#1a1a1a', borderRadius: '1.5rem' }}
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
