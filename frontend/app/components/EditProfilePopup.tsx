import React from 'react';
import Image from 'next/image';
import { X, Star, User, MapPin } from 'lucide-react';

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
				<div className="shadow-2xl overflow-hidden border" style={{ maxHeight: '90vh', backgroundColor: '#fadde1', borderColor: 'rgba(93, 88, 105, 0.1)', borderRadius: '2.5rem' }}>
					{/* Modern Header */}
					<div className="relative px-6 py-5 border-b" style={{ backgroundColor: '#fadde1', borderColor: 'rgba(93, 88, 105, 0.1)' }}>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="p-2 shadow-lg" style={{ backgroundColor: '#3a3a3a', borderRadius: '1.5rem' }}>
									<User className="h-5 w-5 text-white" />
								</div>
								<h2 className="text-xl font-bold" style={{ fontFamily: "'Rubik', sans-serif", color: '#5D5869' }}>
									Mentor Profile
								</h2>
							</div>
							<button
								className="p-2 rounded-full transition-all duration-200"
								style={{ color: '#5D5869' }}
								onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(93, 88, 105, 0.1)'}
								onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
										className="object-cover shadow-xl"
										style={{ borderRadius: '2rem', border: '4px solid #f4acb7' }}
									/>
									{/* Star Badge */}
									<div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2" style={{ backgroundColor: '#fadde1', borderColor: '#f4acb7' }}>
										<Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
									</div>
								</div>
							</div>

							<h3 className="text-2xl font-bold mb-1" style={{ color: '#5D5869' }}>{mentor.name}</h3>
							<p className="text-base mb-2" style={{ color: '#5D5869', opacity: 0.8 }}>{mentor.title}</p>
							<p className="text-sm mb-3" style={{ color: '#5D5869', opacity: 0.7 }}>{mentor.company}</p>

							<div className="flex items-center gap-4 text-sm mb-4" style={{ color: '#5D5869', opacity: 0.8 }}>
								<div className="flex items-center gap-1">
									<Star className="h-4 w-4 text-yellow-500" />
									<span className="font-medium">({mentor.reviews} reviews)</span>
								</div>
								<span style={{ color: '#5D5869', opacity: 0.4 }}>•</span>
								<div className="flex items-center gap-1">
									<MapPin className="h-4 w-4" />
									<span>{mentor.location}</span>
								</div>
							</div>

						</div>

						{/* About Section */}
						<div className="mb-6 mt-4">
							<h4 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#5D5869' }}>
								<div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#3a3a3a' }}></div>
								About
							</h4>
							<div className="p-4 border" style={{ backgroundColor: '#f4acb7', borderColor: 'rgba(93, 88, 105, 0.1)', borderRadius: '1.5rem' }}>
								<p className="text-sm leading-relaxed" style={{ color: '#000000' }}>{mentor.bio}</p>
							</div>
						</div>

						{/* Education Section */}
						<div className="mb-6">
							<h4 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#5D5869' }}>
								<div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#3a3a3a' }}></div>
								Education
							</h4>
							<div className="p-4 border" style={{ backgroundColor: '#f4acb7', borderColor: 'rgba(93, 88, 105, 0.1)', borderRadius: '1.5rem' }}>
								<p className="text-sm leading-relaxed" style={{ color: '#000000' }}>
									B.Tech in Computer Science, IIT Delhi<br />
									M.S. in Software Engineering, Stanford University
								</p>
							</div>
						</div>

						{/* Expertise Section */}
						<div>
							<h4 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#5D5869' }}>
								<div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#3a3a3a' }}></div>
								Expertise
							</h4>
							<div className="flex flex-wrap gap-2">
								{mentor.expertise && mentor.expertise.length > 0 ? (
									mentor.expertise.map((skill: string, idx: number) => (
										<span
											key={idx}
											className="px-3 py-2 border font-medium text-sm shadow-sm hover:shadow-md transition-shadow"
											style={{ backgroundColor: '#f4acb7', borderColor: 'rgba(93, 88, 105, 0.1)', color: '#000000', borderRadius: '1rem' }}
										>
											{skill}
										</span>
									))
								) : (
									<span className="text-sm" style={{ color: '#5D5869', opacity: 0.7 }}>No expertise listed.</span>
								)}
							</div>
						</div>
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
