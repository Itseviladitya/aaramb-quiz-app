"use client";

import { FiCode, FiHeart, FiGithub } from "react-icons/fi";

export default function LandingFooter() {
    return (
        <footer className="relative py-12 md:py-16">
            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Top border gradient */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mb-12" />

                <div className="flex flex-col items-center text-center gap-6">
                    {/* Brand */}
                    <div>
                        <h3 className="text-xl font-extrabold text-white">
                            Aarambh<span className="landing-gradient-text"> Quiz</span>
                        </h3>
                        <p className="mt-2 text-sm text-slate-400 max-w-md">
                            The official quiz platform of Aarambh Club, built to make technical
                            events more interactive and accessible for students.
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {/* Developer credit */}
                    <div className="landing-glass rounded-2xl px-6 py-4 inline-flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <FiCode className="w-4 h-4 text-cyan-400" />
                            <span>Crafted by</span>
                            <span className="font-bold text-white">Aditya Gupta</span>
                            <span className="text-slate-500"><a href="http://www.devaditya.dev" target="_blank">Portfolio</a></span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Member of Aarambh Club, Ramgarh Engineering College
                        </p>
                    </div>

                    {/* Bottom text */}
                    <p className="text-xs text-slate-600 flex items-center gap-1">
                        Built with <FiHeart className="w-3 h-3 text-rose-400" /> for the students of REC by aditya gupta.
                    </p>
                </div>
            </div>
        </footer>
    );
}
