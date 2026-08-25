import LegalPageLayout from '@/Components/LegalPageLayout';
import { Head } from '@inertiajs/react';

const icon = <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;

const sections = [
    {
        id: 'overview',
        title: 'Overview',
        body: (
            <p>
                These Terms of Use govern your access to and use of Synkro. By creating an account, you
                agree to these terms. Synkro was built as a school (PFA) project at Kernel Solution &amp;
                Innovation.
            </p>
        ),
    },
    {
        id: 'your-account',
        title: 'Your account',
        body: (
            <p>
                You're responsible for the security of your own account, including keeping your password
                confidential and reviewing your signed-in devices (Settings &gt; Logged in devices) for
                anything unfamiliar - you can disconnect any session you don't recognize yourself. You must
                provide accurate information when registering and keep it up to date.
            </p>
        ),
    },
    {
        id: 'acceptable-use',
        title: 'Acceptable use',
        body: (
            <>
                <ul className="list-disc space-y-1.5 pl-5">
                    <li>Don't use Synkro to upload, link to, or share unlawful, abusive, or infringing content.</li>
                    <li>Don't attempt to access another user's account or data you're not a member of.</li>
                    <li>Don't attempt to disrupt or overload the platform's infrastructure.</li>
                    <li>Respect other members within shared projects: comments and feedback should stay on-topic and respectful.</li>
                </ul>
                <p className="mt-3">
                    Accounts that violate these terms may be suspended. Suspended users can appeal the decision
                    through the built-in appeals process, which an administrator will review.
                </p>
            </>
        ),
    },
    {
        id: 'your-content',
        title: 'Your content',
        body: (
            <p>
                You retain ownership of the projects, tasks, comments, and files you create in Synkro.
                You're solely responsible for the content you upload or link to, and for having the rights
                to share it with your project's other members.
            </p>
        ),
    },
    {
        id: 'suspension-termination',
        title: 'Account suspension and termination',
        body: (
            <p>
                Synkro administrators may suspend an account, temporarily or permanently, for violations of
                these terms. You may also delete your own account at any time from Account Settings, which
                requires email confirmation before it takes effect. A deleted account is held for a short
                grace period during which it can be restored by entering a 6-digit code emailed to you at
                the login screen; once that window passes, deletion is permanent.
            </p>
        ),
    },
    {
        id: 'no-warranty',
        title: 'No warranty',
        body: (
            <p>
                Synkro is provided as a student project, on an "as is" basis, without warranties of any
                kind. While reasonable care has gone into its design, no guarantee is made regarding
                uptime, data durability, or fitness for any particular purpose.
            </p>
        ),
    },
    {
        id: 'changes',
        title: 'Changes to these terms',
        body: (
            <p>
                These terms may be updated from time to time as the platform evolves. Continued use of
                Synkro after a change constitutes acceptance of the updated terms.
            </p>
        ),
    },
    {
        id: 'contact',
        title: 'Contact',
        body: (
            <p>
                Questions about these terms can be sent through the in-app Feedback form.
            </p>
        ),
    },
];

export default function TermsOfUse() {
    return (
        <>
            <Head title="Terms of Use" />
            <LegalPageLayout
                title="Terms of Use"
                updatedAt="August 2026"
                icon={icon}
                intro="The ground rules for using Synkro - what you're responsible for, what's not allowed, and what happens if things go wrong."
                sections={sections}
            />
        </>
    );
}
