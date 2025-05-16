"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faUsers, faChartLine, faCheckCircle, faListAlt, faCogs } from '@fortawesome/free-solid-svg-icons';
import { Footer } from "@/components/footer";

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#160A3A]">
      {/* Hero Section */}
      <section className="pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              How It Works
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Discover how TMM Tournaments simplifies tournament management with powerful tools like the Single Bracket System, waitlist functionality, and real-time updates.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#201644]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Our Key Features
            </h2>
            <p className="text-gray-300 max-w-3xl mx-auto">
              From creating tournaments to managing participants, our platform offers everything you need to run seamless events.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Single Bracket System */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-[#2a1a66] p-6 rounded-lg"
            >
              <div className="text-[#7458da] mb-4">
                <FontAwesomeIcon icon={faListAlt} className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Single Bracket System
              </h3>
              <p className="text-gray-300">
                Effortlessly manage brackets with our integrated system. Move teams, handle waitlists, and track progress in real-time.
              </p>
            </motion.div>

            {/* Waitlist Functionality */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-[#2a1a66] p-6 rounded-lg"
            >
              <div className="text-[#7458da] mb-4">
                <FontAwesomeIcon icon={faCheckCircle} className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Waitlist Management
              </h3>
              <p className="text-gray-300">
                Automatically manage waitlists and ensure smooth transitions when teams drop out or join.
              </p>
            </motion.div>

            {/* Real-Time Updates */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-[#2a1a66] p-6 rounded-lg"
            >
              <div className="text-[#7458da] mb-4">
                <FontAwesomeIcon icon={faChartLine} className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Real-Time Updates
              </h3>
              <p className="text-gray-300">
                Stay updated with live match results, team progress, and tournament standings.
              </p>
            </motion.div>

            {/* Easy Tournament Creation */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-[#2a1a66] p-6 rounded-lg"
            >
              <div className="text-[#7458da] mb-4">
                <FontAwesomeIcon icon={faTrophy} className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Easy Tournament Creation
              </h3>
              <p className="text-gray-300">
                Set up tournaments in minutes with our intuitive interface and customizable options.
              </p>
            </motion.div>

            {/* Team Management */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-[#2a1a66] p-6 rounded-lg"
            >
              <div className="text-[#7458da] mb-4">
                <FontAwesomeIcon icon={faUsers} className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Team Management
              </h3>
              <p className="text-gray-300">
                Manage team rosters, track performance, and communicate with participants seamlessly.
              </p>
            </motion.div>

            {/* Advanced Settings */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-[#2a1a66] p-6 rounded-lg"
            >
              <div className="text-[#7458da] mb-4">
                <FontAwesomeIcon icon={faCogs} className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Advanced Settings
              </h3>
              <p className="text-gray-300">
                Customize tournament rules, scoring systems, and more to fit your needs.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-[#2a1a66] rounded-lg p-8 md:p-12 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Elevate Your Tournaments?
            </h2>
            <p className="text-gray-300 mb-6">
              Sign up today and experience the future of tournament management.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                className="bg-[#7458da] hover:bg-[#604BAC] text-white px-6 py-3 rounded-lg transition-colors font-medium"
              >
                Explore Tournaments
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}