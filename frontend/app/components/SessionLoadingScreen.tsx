'use client';

import { MoonLoader } from 'react-spinners';

export default function SessionLoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(255, 255, 255, 0.7)' }}>
      <MoonLoader color="#000000" size={60} />
    </div>
  );
}
