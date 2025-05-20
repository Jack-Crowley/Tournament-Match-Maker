"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { useClient } from "@/context/clientContext";

const Navbar = () => {
  const client = useClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav
      className={`w-full z-50 fixed top-0 left-0 transition-all duration-300
      } ${isMenuOpen ? 'bg-[#201644]' : 'bg-background' }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[10vh]">
          <Link href="/" className="flex items-center">
            <span className="text-white font-bold text-2xl">TMM</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {/* <Link href="/teams" className="text-white hover:text-[#7458da] transition-colors">
              Teams
            </Link>
            <Link href="/organizations" className="text-white hover:text-[#7458da] transition-colors">
              Organizations
            </Link> */}

            {client.session?.user ? (
              <div className="flex items-center space-x-8">
                <Link href="/account" className="text-white hover:text-[#7458da] transition-colors">
                  Account
                </Link>
                <Link
                  href="/tournament/join"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-indigo-700/30"
                >
                  Join
                </Link>
                <Link
                  href="/tournaments"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-indigo-700/30"
                >
                  Tournaments
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/tournament/join"
                  className="text-white border border-[#7458da] hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-indigo-700/30 hover:translate-y-[-2px]"
                >
                  Join
                </Link>
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-indigo-700/30 hover:translate-y-[-2px]"
                >
                  Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="text-white p-2"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <FontAwesomeIcon
                icon={isMenuOpen ? faTimes : faBars}
                className="h-6 w-6"
              />
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <motion.div
          className="md:hidden bg-[#201644] absolute w-full"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-4 pt-2 pb-6 space-y-4">
            {/* <Link
              href="/teams"
              className="block text-white hover:text-[#7458da] py-2 transition-colors"
              onClick={toggleMenu}
            >
              Teams
            </Link>
            <Link
              href="/organizations"
              className="block text-white hover:text-[#7458da] py-2 transition-colors"
              onClick={toggleMenu}
            >
              Organization
            </Link> */}

            {client.session?.user ? (
              <div className="flex flex-col space-y-4">
                <Link
                  href="/account"
                  className="block text-white hover:text-[#7458da] py-2 transition-colors"
                  onClick={toggleMenu}
                >
                  Account
                </Link>
                <Link
                  href="/tournament/join"
                  className="block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-indigo-700/30 hover:translate-y-[-2px] text-center"
                  onClick={toggleMenu}
                >
                  Join
                </Link>
                <Link
                  href="/tournaments"
                  className="block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-indigo-700/30 hover:translate-y-[-2px] text-center"
                  onClick={toggleMenu}
                >
                  Tournaments
                </Link>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  href="/tournament/join"
                  className="block text-white border border-[#7458da] hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-indigo-700/30 hover:translate-y-[-2px] text-center"
                  onClick={toggleMenu}
                >
                  Join
                </Link>
                <Link
                  href="/login"
                  className="block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-indigo-700/30 hover:translate-y-[-2px] text-center"
                  onClick={toggleMenu}
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;