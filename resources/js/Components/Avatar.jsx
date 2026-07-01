const palette = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];

function colorFor(name) {
    const sum = (name || '?').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return palette[sum % palette.length];
}

function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function Avatar({ user, size = 'h-8 w-8' }) {
    if (user?.avatar_path) {
        return <img src={`/storage/${user.avatar_path}`} alt={user.name} className={`${size} rounded-full object-cover`} />;
    }

    return (
        <div className={`${size} flex items-center justify-center rounded-full text-xs font-semibold text-white ${colorFor(user?.name)}`}>
            {initials(user?.name)}
        </div>
    );
}