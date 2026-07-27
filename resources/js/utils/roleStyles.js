// Color classes for a project role badge (owner/manager/member/tester pivot
// role, plus the global admin role). Shared so a badge looks the same
// wherever a role is shown - the Members list in Projects/Show.jsx and the
// comment author badges in TaskRow.jsx both import this instead of keeping
// their own copy that could drift out of sync.
export const roleStyles = {
    owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    member: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    tester: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    admin: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};
