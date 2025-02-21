"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const mobileMenuVariants = {
    open: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    closed: { opacity: 0, y: "-100%", transition: { duration: 0.2 } },
  };

  return (
    <nav id="navbar" className="pl-8 pr-8 pb-4 pt-10 flex items-center z-20 relative">
      <div className="w-48">
        <Link href="/" className="text-3xl">
          TMM
        </Link>
      </div>

      <div className="flex-1 hidden md:flex justify-center">
        <div className="flex space-x-8">
          <Link href="/teams" className="hover:underline text-2xl font-bold">
            Teams
          </Link>
          <Link href="/tournaments" className="hover:underline text-2xl font-bold">
            Tournaments
          </Link>
          <Link href="/organizations" className="hover:underline text-2xl font-bold">
            Organizations
          </Link>
        </div>
      </div>

      <div className="md:hidden flex-1 flex justify-end">
        <button onClick={toggleMobileMenu} className="text-white focus:outline-none">
          <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            className="md:hidden absolute top-24 left-0 w-full bg-[#251a4f] p-4"
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
          >
            <div className="flex flex-col space-y-4">
              <Link href="/teams" className="hover:underline text-2xl font-bold" onClick={closeMobileMenu}>
                Teams
              </Link>
              <Link href="/tournaments" className="hover:underline text-2xl font-bold" onClick={closeMobileMenu}>
                Tournaments
              </Link>
              <Link href="/organizations" className="hover:underline text-2xl font-bold" onClick={closeMobileMenu}>
                Organizations
              </Link>
              <Link href="/account" className="hover:underline text-2xl font-bold" onClick={closeMobileMenu}>
                Account
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-48 hidden md:flex justify-end">
        <Link href="/account">
          <div className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-[#7e67d2] hover:cursor-pointer">
            <FontAwesomeIcon icon={faUser} className="text-white w-6 h-6" />
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;