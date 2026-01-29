"use client";
import { cn } from "@/app/lib/utils";
import { X, Menu } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";

import React, { useRef, useState } from "react";
import Link from "next/link";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
    onClick?: () => void;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      suppressHydrationWarning
      className={cn("fixed inset-x-0 top-0 z-50 w-full py-4", className)}
      style={{ backgroundColor: '#F3E8DF' }}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible },
            )
          : child,
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      suppressHydrationWarning
      animate={{
        boxShadow: visible
          ? "0 4px 30px rgba(0, 0, 0, 0.15)"
          : "0 4px 30px rgba(0, 0, 0, 0.1)",
        width: visible ? "60%" : "100%",
        y: visible ? 10 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      style={{
        minWidth: "800px",
        backgroundColor: '#948979',
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between rounded-full px-6 py-2 lg:flex",
        visible && "border-b border-white/20",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium transition duration-200 lg:flex lg:space-x-2",
        className,
      )}
    >
      {items.map((item, idx) => (
        <button
          key={`link-${idx}`}
          onMouseEnter={() => setHovered(idx)}
          onClick={() => {
            item.onClick?.();
            onItemClick?.();
          }}
          className="relative px-4 py-2 text-white/90 hover:text-white"
          style={{ fontFamily: "'Rubik', sans-serif" }}
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-full bg-white/10"
            />
          )}
          <span className="relative z-20">{item.name}</span>
        </button>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      suppressHydrationWarning
      animate={{
        boxShadow: visible
          ? "0 4px 30px rgba(0, 0, 0, 0.15)"
          : "0 4px 30px rgba(0, 0, 0, 0.1)",
        width: visible ? "95%" : "100%",
        paddingRight: visible ? "12px" : "0px",
        paddingLeft: visible ? "12px" : "0px",
        borderRadius: visible ? "12px" : "0px",
        y: visible ? 10 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      style={{
        backgroundColor: '#948979',
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between px-0 py-2 lg:hidden",
        visible && "border-b border-white/20",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between px-6 h-20",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn(
            "w-full flex flex-col items-start justify-start gap-4 px-6 py-6 border-t border-white/10",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
      aria-label="Toggle menu"
    >
      {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
    </button>
  );
};

export const NavbarLogo = () => {
  return (
    <div className="flex items-center gap-3 group cursor-pointer relative z-20">
      <div className="relative">
        <img 
          src="/icons/icon-96x96.png" 
          alt="Confiido Logo" 
          className="h-11 w-11 object-contain transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <h1 
        className="text-2xl font-bold text-white italic uppercase tracking-wide transition-all duration-300 group-hover:tracking-wider" 
        style={{ fontFamily: "'BespokeStencil-BoldItalic', sans-serif", textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}
      >
        Confiido
      </h1>
    </div>
  );
};

export const NavbarButton = ({
  href,
  children,
  className,
  variant = "primary",
  onClick,
  ...props
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
  onClick?: (e?: any) => void;
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out transform hover:scale-105 inline-block text-center whitespace-nowrap";

  const variantStyles = {
    primary:
      "bg-black text-white hover:bg-gray-900 shadow-md hover:shadow-lg w-20",
    secondary: "bg-black text-white hover:bg-gray-900 shadow-md hover:shadow-lg w-20",
  };

  const content = (
    <>
      <span className="relative z-10">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseStyles, variantStyles[variant], className)}
        style={{ fontFamily: "'Rubik', sans-serif" }}
        onClick={onClick}
        {...(props as any)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ fontFamily: "'Rubik', sans-serif" }}
      onClick={onClick}
      {...(props as any)}
    >
      {content}
    </button>
  );
};
