export default function ApplicationLogo(props) {
    return (
        <svg {...props} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M24 8.5c0-2-2-3.5-5-3.5h-4c-3 0-5.5 2-5.5 4.5S11.5 13 14 13h4c3 0 5.5 2 5.5 4.5S21 22 18 22h-4c-3 0-5-1.5-5-3.5"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
            />
            <circle cx="24" cy="22" r="2.2" fill="currentColor" />
        </svg>
    );
}