"use client";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-10" aria-label="Footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
        <div className="flex items-center gap-2 font-semibold text-white/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt="FundKeep logo"
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
          <span className="text-red font-black">Fund</span>Keep
          <span className="text-white/15 font-light">|</span>
          <span className="font-normal text-white/30">Lock your savings. Reach your goals.</span>
        </div>
        <p>© {new Date().getFullYear()} FundKeep. Built on Stellar.</p>
      </div>
    </footer>
  );
}
