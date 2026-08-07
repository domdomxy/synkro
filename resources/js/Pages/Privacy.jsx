import LegalPageLayout from '@/Components/LegalPageLayout';
import { Head } from '@inertiajs/react';

const icon = <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v2" />;

const sections = [
    {
        id: 'overview',
        title: 'Overview',
        body: (
            <p>
                This Privacy Policy explains what information Synkro collects when you use the platform,
                how it is used, and the choices you have. Synkro was built as a school (PFA) project at
                Kernel Solution &amp; Innovation, and this policy describes how the application actually
                behaves rather than a generic legal template.
            </p>
        ),
    },
    {
        id: 'information-we-collect',
        title: 'Information we collect',
        body: (
            <ul className="list-disc space-y-1.5 pl-5">
                <li>Account details you provide: name, email address, and password (stored as a salted hash, never in plain text).</li>
                <li>Content you create: projects, tasks, comments, notes, and any files or links you attach as deliverables.</li>
                <li>Session activity: approximate location, browser, and device for each active sign-in, so you can see exactly who's signed into your account right now and disconnect any session you don't recognize.</li>
                <li>Notification preferences and reminders you set up.</li>
                <li>Support tickets and suspension appeals you submit, along with any admin responses.</li>
            </ul>
        ),
    },
    {
        id: 'how-we-use-it',
        title: 'How we use it',
        body: (
            <p>
                Your information is used to operate the core features of Synkro: showing your projects and
                tasks, delivering in-app and email notifications you've opted into, powering your personal
                dashboard, and letting administrators moderate the platform (for example, reviewing support
                tickets, handling suspension appeals, or looking into a report about your account). We do
                not sell your data or use it for advertising.
            </p>
        ),
    },
    {
        id: 'third-party-services',
        title: 'Third-party services',
        body: (
            <p>
                Synkro relies on very few third-party services to function: mainly an email provider to
                deliver notification emails. Real-time updates (live notifications, dashboard activity, and
                the like) run over a self-hosted WebSocket server rather than a third-party broadcasting
                service, so that data doesn't leave Synkro's own infrastructure.
            </p>
        ),
    },
    {
        id: 'data-retention',
        title: 'Data retention and deletion',
        body: (
            <p>
                You can request deletion of your account at any time from Account Settings. Deletion
                requires confirming via a link sent to your email before it takes effect. Rather than being
                erased immediately, a deleted account, project, or task is held in a recoverable state for
                a grace period (7 days by default) - logging back in restores a deleted account within that
                window, and a project or task can be restored from the Trash section of Settings. Once the
                grace period passes, the data is purged permanently. Some records, such as the
                administrative audit log, may be retained in de-identified or aggregate form for platform
                integrity.
            </p>
        ),
    },
    {
        id: 'admin-access',
        title: 'Admin access to your activity',
        body: (
            <p>
                Administrators can look up a user's own account activity and past sign-in history for
                support and moderation purposes - for example, investigating a report or a suspension
                appeal. This does not notify you, since routine lookups shouldn't generate noise, but every
                such lookup is itself written to the permanent admin audit log, the same as any other admin
                action.
            </p>
        ),
    },
    {
        id: 'your-choices',
        title: 'Your choices',
        body: (
            <p>
                You control which email notifications you receive from Settings, can review and revoke
                trusted external link hosts from your account, and can view and disconnect your own active
                sessions from Settings &gt; Logged in devices at any time.
            </p>
        ),
    },
    {
        id: 'contact',
        title: 'Contact',
        body: (
            <p>
                Questions about this policy can be sent through the in-app Feedback form, which reaches
                the Synkro team directly.
            </p>
        ),
    },
];

export default function Privacy() {
    return (
        <>
            <Head title="Privacy Policy" />
            <LegalPageLayout
                title="Privacy Policy"
                updatedAt="August 2026"
                icon={icon}
                intro="What Synkro collects, why, and the controls you have over it - in plain language, not legal boilerplate."
                sections={sections}
            />
        </>
    );
}
