import { useEffect, useState } from 'react';

function ChevronUpIcon() {
    return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
    );
}

/**
 * Floating action button (styled after Welcome.jsx's back-to-top button) that
 * scrolls back up to the pagination bar instead of all the way to the page
 * top - useful on paginated list/table pages where the controls live above a
 * long list and scroll out of view.
 *
 * Pass `targetRef` pointing at the element wrapping <Pagination /> (usually
 * the same toolbar div that also holds <PerPageSelect />). The button fades
 * in once that element has scrolled above the viewport and there's enough
 * page height for scrolling back up to be worth a shortcut.
 */
export default function ScrollToPaginationButton({ targetRef, offset = 96 }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let ticking = false;

        const measure = () => {
            ticking = false;
            const el = targetRef?.current;
            if (!el) {
                setVisible(false);
                return;
            }
            const rect = el.getBoundingClientRect();
            const doc = document.documentElement;
            const scrolledPastTarget = rect.bottom < 0;
            const hasScrollableRoom = doc.scrollHeight - doc.clientHeight > 400;
            setVisible(scrolledPastTarget && hasScrollableRoom);
        };

        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(measure);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });
        measure();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [targetRef]);

    const scrollToPagination = () => {
        const el = targetRef?.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    };

    return (
        <button
            type="button"
            onClick={scrollToPagination}
            aria-label="Scroll up to pagination"
            title="Back to pagination"
            className={`fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-500 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-400 dark:hover:text-gray-100 ${
                visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
            }`}
        >
            <ChevronUpIcon />
        </button>
    );
}
