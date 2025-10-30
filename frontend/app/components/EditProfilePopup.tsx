import React from 'react';
import Image from 'next/image';
import { X, Star, MessageCircle, Calendar, User, Award, Briefcase, MapPin } from 'lucide-react';

export interface MentorData {
		name: string;
		title: string;
		company: string;
		reviews: number;
		location: string;
		rate: number;
		image: string;
		bio: string;
		expertise?: string[];
}

interface EditProfilePopupProps {
	onClose: () => void;
	mentor: MentorData;
}

const EditProfilePopup: React.FC<EditProfilePopupProps> = ({ onClose, mentor }) => {
	React.useEffect(() => {
		// Disable dashboard scroll when popup is open
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = '';
		};
	}, []);

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
			<div className="relative w-full animate-popup-in" style={{ maxWidth: '50vw', width: '90%', minWidth: '320px' }}>
				<div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200" style={{ maxHeight: '90vh' }}>
					{/* Modern Header */}
					<div className="relative bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-xl shadow-lg" style={{ background: '#3E5F44' }}>
									<User className="h-5 w-5 text-white" />
								</div>
								<h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
									Mentor Profile
								</h2>
							</div>
							<button
								className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all duration-200"
								onClick={onClose}
								aria-label="Close"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
					</div>

					{/* Content */}
					<div className="p-8 overflow-y-auto hide-scrollbar" style={{ maxHeight: 'calc(90vh - 100px)' }}>
						{/* Profile Picture and Name - Centered */}
						<div className="flex flex-col items-center mb-8">
							<div className="relative mb-4">
								<div className="relative w-32 h-32">
									<Image 
										src={mentor.image} 
										alt={mentor.name} 
										width={128}
										height={128}
										className="object-cover rounded-2xl border-4 border-gray-200 shadow-xl" 
									/>
									{/* Star Badge */}
									<div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-200">
										<Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
									</div>
								</div>
							</div>
							
							<h3 className="text-2xl font-bold text-gray-900 mb-1">{mentor.name}</h3>
							<p className="text-base text-gray-600 mb-2">{mentor.title}</p>
							<p className="text-sm text-gray-500 mb-3">{mentor.company}</p>
							
							<div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
								<div className="flex items-center gap-1">
									<Star className="h-4 w-4 text-yellow-500" />
									<span className="font-medium">({mentor.reviews} reviews)</span>
								</div>
								<span className="text-gray-400">•</span>
								<div className="flex items-center gap-1">
									<MapPin className="h-4 w-4" />
									<span>{mentor.location}</span>
								</div>
							</div>

							<div className="flex items-baseline gap-2 mb-6">
								<span className="text-3xl font-bold" style={{ color: '#3E5F44' }}>₹{mentor.rate}</span>
								<span className="text-sm text-gray-500">per hour</span>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="grid grid-cols-2 gap-3 mb-8">
							<button className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all">
								<Award className="h-4 w-4" />
								Free Trial
							</button>
							<button className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all">
								<User className="h-4 w-4" />
								1 on 1
							</button>
							<button className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold text-sm shadow-sm hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all">
								<Briefcase className="h-4 w-4" />
								Career Guidance
							</button>
							<button 
								className="flex items-center justify-center gap-2 text-white px-4 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all"
								style={{ backgroundColor: '#3E5F44' }}
								onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2F4A35'}
								onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3E5F44'}
							>
								<MessageCircle className="h-4 w-4" />
								Message
							</button>
						</div>

						{/* Book Session Button */}
						<button 
							className="w-full flex items-center justify-center gap-2 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all mb-8"
							style={{ backgroundColor: '#3E5F44' }}
							onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2F4A35'}
							onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3E5F44'}
						>
							<Calendar className="h-5 w-5" />
							Book a Session
						</button>

						{/* About Section */}
						<div className="mb-6">
							<h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
								<div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#3E5F44' }}></div>
								About
							</h4>
							<div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
								<p className="text-sm text-gray-700 leading-relaxed">{mentor.bio}</p>
							</div>
						</div>

						{/* Education Section */}
						<div className="mb-6">
							<h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
								<div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#3E5F44' }}></div>
								Education
							</h4>
							<div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
								<p className="text-sm text-gray-700 leading-relaxed">
									B.Tech in Computer Science, IIT Delhi<br />
									M.S. in Software Engineering, Stanford University
								</p>
							</div>
						</div>

						{/* Expertise Section */}
						<div>
							<h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
								<div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#3E5F44' }}></div>
								Expertise
							</h4>
							<div className="flex flex-wrap gap-2">
								{mentor.expertise && mentor.expertise.length > 0 ? (
									mentor.expertise.map((skill: string, idx: number) => (
										<span 
											key={idx} 
											className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-gray-700 font-medium text-sm shadow-sm hover:shadow-md transition-shadow"
										>
											{skill}
										</span>
									))
								) : (
									<span className="text-sm text-gray-500">No expertise listed.</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
			<style jsx>{`
				@keyframes shimmer {
					0% { background-position: -200% 0; }
					100% { background-position: 200% 0; }
				}
				.animate-shimmer {
					animation: shimmer 3s ease-in-out infinite;
				}
				.animate-popup-in {
					animation: popup-in 0.5s cubic-bezier(.4,2,.3,1) both;
				}
				@keyframes popup-in {
					0% { opacity: 0; transform: scale(0.85); }
					100% { opacity: 1; transform: scale(1); }
				}
				.hide-scrollbar {
					scrollbar-width: none !important;
				}
				.hide-scrollbar::-webkit-scrollbar {
					display: none !important;
				}
			`}</style>
		</div>
	);
};

export default EditProfilePopup;
