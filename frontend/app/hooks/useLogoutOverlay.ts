import { useState } from 'react';

export const useLogoutOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openLogoutOverlay = () => setIsOpen(true);
  const closeLogoutOverlay = () => setIsOpen(false);

  return {
    isOpen,
    openLogoutOverlay,
    closeLogoutOverlay
  };
};
