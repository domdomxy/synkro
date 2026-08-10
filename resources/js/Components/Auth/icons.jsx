// Small inline icon set shared by the auth pages. Kept in the same
// hand-drawn SVG style used elsewhere in the app (e.g. Welcome.jsx,
// VerifyEmail.jsx) rather than pulling in an icon library.

export function MailIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );
}

export function LockIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v2" />
        </svg>
    );
}

export function UserIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" />
        </svg>
    );
}

export function EyeIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5-9.75-7.5-9.75-7.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

export function ClockIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

export function BanIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM5.6 5.6l12.8 12.8" />
        </svg>
    );
}

export function EyeOffIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.58a3 3 0 004.24 4.24M9.88 5.09A9.77 9.77 0 0112 4.5c6 0 9.75 7.5 9.75 7.5a13.06 13.06 0 01-3.14 3.9M6.6 6.6C4.13 8.28 2.25 10.5 2.25 12s3.75 7.5 9.75 7.5c1.64 0 3.1-.32 4.36-.85" />
        </svg>
    );
}

export function ScaleIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M6 8l-3.5 6a3.5 3.5 0 007 0L6 8zm12 0l-3.5 6a3.5 3.5 0 007 0L18 8zM3.5 8h5M15.5 8h5M8 21h8" />
        </svg>
    );
}

export function RestoreIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v1M3 10l4-4M3 10l4 4" />
        </svg>
    );
}

// Error page icons (bootstrap/app.php's exceptions->render() closure ->
// resources/js/Pages/Error.jsx). Kept in the same hand-drawn style as the
// rest of this set rather than pulling in an icon library.

export function CompassIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.5 8.5l-2.2 5.2a1 1 0 01-.6.6L8.5 15.5l2.2-5.2a1 1 0 01.6-.6l4.2-1.2z" />
        </svg>
    );
}

export function AlertTriangleIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
        </svg>
    );
}

export function CloudOffIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.5 5.05A5 5 0 0118.5 8h.25a4.25 4.25 0 01.9 8.4M7 8.16A4.5 4.5 0 006.5 17H16" />
        </svg>
    );
}

export function GaugeIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19a7.5 7.5 0 1115 0M12 13l3-3.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19h.01" />
        </svg>
    );
}
