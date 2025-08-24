import React, { useState, useEffect } from 'react';
import { Select, SelectItem } from './ui/Select';

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
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn" style={{ background: 'transparent' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-md relative p-4 sm:p-10 transition-all duration-300 overflow-hidden" style={{ maxHeight: '90vh' }}>
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
                    onClick={onClose}
                    aria-label="Close"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold mb-6 text-left">Edit Profile</h2>
                <div
                    className="overflow-y-auto"
                    style={{ maxHeight: '70vh', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <form className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input id="username" name="username" type="text" value={profile.username} onChange={handleChange} className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-0" />
                            <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-1 mt-2">Profession</label>
                            <input id="profession" name="profession" type="text" value={profile.profession} onChange={handleChange} className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-0" />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
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
                            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1 mt-3">Date of Birth</label>
                            <input id="dateOfBirth" name="dateOfBirth" type="date" value={profile.dateOfBirth} onChange={handleChange} className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-0" />
                        </div>
                        {/* Profession field moved below Username */}
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input id="phoneNumber" name="phoneNumber" type="tel" value={profile.phoneNumber} onChange={handleChange} className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-0" />
                        </div>
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                            <input id="whatsappNumber" name="whatsappNumber" type="tel" value={profile.whatsappNumber} onChange={handleChange} className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all duration-200 min-w-0" />
                        </div>
                        <div className="col-span-2 flex flex-col space-y-2">
                            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                            <input id="linkedin" name="linkedin" type="text" value={profile.linkedin} onChange={handleChange} className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all duration-200" />
                        </div>
                        <div className="col-span-2 flex gap-4">
                            <button
                                type="button"
                                className="w-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-2xl font-semibold shadow-lg mt-6 transition-all duration-300 hover:scale-105"
                                onClick={handleSave}
                            >
                                Save Profile
                            </button>
                            <button	
                                type="button"
                                className="w-1/2 bg-gradient-to-r from-gray-400 to-gray-700 text-white py-3 rounded-2xl font-semibold shadow-lg mt-6 transition-all duration-300 hover:scale-105"
                                onClick={handleLogout}
                            >
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
