import { motion } from "framer-motion";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faQrcode, faUserPlus, faPlay, faDownload } from '@fortawesome/free-solid-svg-icons';
import { useState, useRef } from 'react';
import QRCode from "react-qr-code";
import { Tournament } from "@/types/tournamentTypes";

interface TournamentJoiningProps {
    tournament: Tournament;
    joinLink: string | null;
    onAllowJoinToggle: () => void;
    onCopyUrl: () => void;
}

export function TournamentJoining({ tournament, joinLink, onAllowJoinToggle, onCopyUrl }: TournamentJoiningProps) {
    const [showQRCode, setShowQRCode] = useState<boolean>(false);
    const qrRef = useRef<HTMLDivElement>(null);

    const downloadQRCode = () => {
        if (!qrRef.current || !tournament) return;

        const svg = qrRef.current.querySelector('svg');

        if (svg) {
            const svgClone = svg.cloneNode(true);
            const svgData = new XMLSerializer().serializeToString(svgClone);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            if (!ctx) {
                return;
            }

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = pngUrl;
                downloadLink.download = `tournament-qr-code.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
            };

            img.src = url;
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center">
                <FontAwesomeIcon icon={faPlay} className="text-purple-300 mr-3" />
                <span>Joining</span>
            </h2>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center mr-3">
                            <FontAwesomeIcon icon={faUserPlus} className="text-purple-200" />
                        </div>
                        <span className="text-white">Allow Players to Join</span>
                    </div>

                    <motion.div
                        className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer ${tournament.allow_join ? "justify-end" : "justify-start"}`}
                        onClick={onAllowJoinToggle}
                        initial={false}
                        animate={{
                            background: tournament.allow_join
                                ? "linear-gradient(45deg, #7458da, #8F78E6)"
                                : "linear-gradient(45deg, #3A3A3A, #5C5C5C)",
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className="w-4 h-4 bg-white rounded-full shadow-md"
                            layout
                            transition={{ type: "spring", stiffness: 200, damping: 30 }}
                        />
                    </motion.div>
                </div>
            </div>

            {joinLink && tournament.allow_join && (
                <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                        <label className="text-sm text-purple-200/70 mb-2 block">Join Code</label>
                        <div className="flex">
                            <input
                                type="text"
                                value={(tournament as any).join_code}
                                readOnly
                                className="w-full p-3 bg-[#22154F]/50 text-white focus:outline-none rounded-lg border border-white/5"
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                        <label className="text-sm text-purple-200/70 mb-2 block">Share Tournament Join Link</label>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex flex-1">
                                <input
                                    type="text"
                                    value={joinLink}
                                    readOnly
                                    className="flex-1 p-3 bg-[#22154F]/50 text-white focus:outline-none rounded-l-lg border border-white/5"
                                />
                                <button
                                    onClick={onCopyUrl}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-r-lg transition duration-200 flex items-center justify-center"
                                >
                                    <FontAwesomeIcon icon={faCopy} />
                                </button>
                            </div>

                            <button
                                onClick={() => setShowQRCode(!showQRCode)}
                                className="bg-indigo-600/20 hover:bg-indigo-600/30 transition-colors p-2 rounded-lg flex items-center justify-center gap-2 px-4 text-white border border-indigo-600/30"
                            >
                                <span>{showQRCode ? "Hide QR" : "Show QR"}</span>
                                <FontAwesomeIcon icon={faQrcode} />
                            </button>
                        </div>

                        {showQRCode && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center mt-6"
                            >
                                <div ref={qrRef} className="p-4 bg-white rounded-lg inline-block mb-4">
                                    <QRCode value={joinLink} size={160} />
                                </div>

                                <button
                                    onClick={downloadQRCode}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center gap-2"
                                >
                                    <span>Download QR Code</span>
                                    <FontAwesomeIcon icon={faDownload} />
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 