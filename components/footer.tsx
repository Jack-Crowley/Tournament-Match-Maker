import Link from "next/link"

export const Footer = () => {
    return (
        <footer className="bg-[#201644] py-8 px-4 sm:px-6 lg:px-8 border-t border-[#2a1a66]">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <Link href="/" className="flex items-center">
                            <span className="text-white font-bold text-xl">TMM</span>
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-4 md:gap-8">
                        <Link href="/about-us" className="text-gray-300 hover:text-[#7458da] transition-colors">
                            About Us
                        </Link>
                        <Link href="/contact-us" className="text-gray-300 hover:text-[#7458da] transition-colors">
                            Contact Us
                        </Link>
                        <Link href="/how-it-works" className="text-gray-300 hover:text-[#7458da] transition-colors">
                            How It Works
                        </Link>
                        <Link href="/faq" className="text-gray-300 hover:text-[#7458da] transition-colors">
                            FAQ
                        </Link>
                        <Link href="/get-started" className="text-gray-300 hover:text-[#7458da] transition-colors">
                            Get Started
                        </Link>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-[#2a1a66] flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-400 text-sm">
                        © 2025 TMM. All rights reserved.
                    </p>
                    <div className="mt-4 md:mt-0 flex gap-6">
                        <Link href="/privacy-policy" className="text-gray-400 hover:text-[#7458da] text-sm">
                            Privacy Policy
                        </Link>
                        <Link href="/terms-of-service" className="text-gray-400 hover:text-[#7458da] text-sm">
                            Terms of Service
                        </Link>
                        <Link href="/cookie-settings" className="text-gray-400 hover:text-[#7458da] text-sm">
                            Cookie Settings
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}