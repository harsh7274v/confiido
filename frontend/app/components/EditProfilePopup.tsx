import React from 'react';

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
					const [aboutExpanded, setAboutExpanded] = React.useState(false);
							return (
										<div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-md">
											<div className="relative w-full max-w-2xl animate-popup-in">
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
													{/* Left: Mentor Image and Buttons */}
													<div className="flex flex-col items-center justify-start bg-[#e0e0e0] p-8 w-1/3 min-w-[220px] border-r border-[#e0e0e0] shadow-xl relative">
																	<div className="relative mb-6 flex flex-col items-center">
																							<div className="relative">
																								<img src={mentor.image} alt={mentor.name} className="w-32 h-32 object-cover rounded-xl border-4 border-[#e0e0e0] shadow-2xl" />
																								{/* Golden star badge at bottom right of profile picture */}
																								<div className="absolute -bottom-2 -right-2 w-8 h-8 flex items-center justify-center">
																									<span className="w-8 h-8 flex items-center justify-center">
																										<svg width="28" height="28" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg">
																											<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
																										</svg>
																									</span>
																								</div>
																							</div>
																							{/* Book a session text and animated down arrow */}
																							<div className="flex items-center gap-2 mt-6">
																								<span className="text-lg font-semibold text-black">Book a session</span>
																								<span className="inline-block animate-bounce">
																									{/* Down arrow SVG icon */}
																									<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black"><polyline points="6 9 12 15 18 9"></polyline></svg>
																								</span>
																							</div>
																	</div>
														<div className="flex flex-col gap-3 mb-6 w-full">
															<button className="flex items-center gap-2 bg-[#f5f5f5] text-black px-4 py-2 rounded-xl font-semibold text-sm shadow hover:bg-[#e0e0e0] hover:text-black active:scale-95 transition w-full border border-[#e0e0e0]">
																<span className="flex w-5 h-5 bg-[#f5f5f5] rounded-full items-center justify-center mr-1">
																	<svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z" /></svg>
																</span>
																Free Trial
															</button>
															<button className="flex items-center gap-2 bg-[#f5f5f5] text-black px-4 py-2 rounded-xl font-semibold text-sm shadow hover:bg-[#e0e0e0] hover:text-black active:scale-95 transition w-full border border-[#e0e0e0]">
																<span className="flex w-5 h-5 bg-[#f5f5f5] rounded-full items-center justify-center mr-1">
																	<svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 01-8 0" /></svg>
																</span>
																1 on 1
															</button>
																			<button className="flex items-center gap-2 bg-[#f5f5f5] text-black px-4 py-2 rounded-xl font-semibold text-sm shadow hover:bg-[#e0e0e0] hover:text-black active:scale-95 transition w-full border border-[#e0e0e0]">
																				<span className="flex w-5 h-5 bg-[#f5f5f5] rounded-full items-center justify-center mr-1">
																					<svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
																				</span>
																				Career Guidance
																			</button>
																			{/* Send a message button */}
																			<button className="flex items-center gap-2 bg-[#ffe066] text-black px-4 py-2 rounded-xl font-semibold text-sm shadow hover:bg-[#ffd700] hover:text-black active:scale-95 transition w-full border border-[#ffd700] mt-3">
																				<span className="flex w-5 h-5 bg-[#ffe066] rounded-full items-center justify-center mr-1">
																					<svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14l4 4V5a2 2 0 0 0-2-2z" /></svg>
																				</span>
																				Send a message
																			</button>
														</div>
													</div>
													{/* Right: Mentor Details */}
																<div
																	className="flex-1 p-10 flex flex-col justify-start bg-[#f5f5f5] relative hide-scrollbar"
																	style={{ maxHeight: '600px', overflowY: 'auto' }}
																>
														<div className="mb-2">
															<span className="text-3xl font-extrabold text-black tracking-tight leading-tight drop-shadow">{mentor.name}</span>
														</div>
														<div className="text-lg text-black font-semibold mb-1 drop-shadow">{mentor.title}</div>
														<div className="text-base text-black mb-1 font-medium">{mentor.company}</div>
														<div className="flex items-center gap-2 text-sm text-black mb-1">
															<span className="font-semibold">({mentor.reviews} reviews)</span>
															<span className="mx-2">•</span>
															<span className="font-semibold">{mentor.location}</span>
														</div>
														<div className="text-2xl text-black font-extrabold mb-2">₹{mentor.rate}</div>
														<div className="text-sm text-black mb-6 font-medium">per hour</div>
														<hr className="my-4 border-[#e0e0e0]" />
														<div className="mt-4">
															<div className="text-lg font-bold text-black mb-2">About</div>
															<div className="text-base text-black leading-relaxed font-medium bg-[#e0e0e0] rounded-xl p-4 shadow-sm border border-[#f5f5f5]">{mentor.bio}</div>
														</div>
														{/* Education Section */}
														<div className="mt-6">
															<div className="text-lg font-bold text-black mb-2">Education</div>
															<div className="bg-[#e0e0e0] rounded-xl p-4 shadow-sm border border-[#f5f5f5] text-base text-black font-medium">
																{/* Example education content, replace with real data if available */}
																B.Tech in Computer Science, IIT Delhi<br />
																M.S. in Software Engineering, Stanford University
															</div>
														</div>
														{/* Expertise Section */}
														<div className="mt-6">
															<div className="text-lg font-bold text-black mb-2">Expertise</div>
															<div className="bg-[#e0e0e0] rounded-xl p-4 shadow-sm border border-[#f5f5f5] text-base text-black font-medium flex flex-wrap gap-2">
																{mentor.expertise && mentor.expertise.length > 0 ? (
																	mentor.expertise.map((skill: string, idx: number) => (
																		<span key={idx} className="px-3 py-1 bg-[#f5f5f5] rounded-lg border border-[#e0e0e0] text-black font-semibold text-sm">{skill}</span>
																	))
																) : (
																	<span>No expertise listed.</span>
																)}
															</div>
														</div>
													</div>
											</div>
										</div>
										<style>{`
											.animate-popup-in {
												animation: popup-in 0.5s cubic-bezier(.4,2,.3,1) both;
											}
											@keyframes popup-in {
												0% { opacity: 0; transform: scale(0.85); }
												100% { opacity: 1; transform: scale(1); }
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

export default EditProfilePopup;
