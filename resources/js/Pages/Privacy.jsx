import LegalPageLayout from '@/Components/LegalPageLayout';
import { Head } from '@inertiajs/react';

function H2({ children }) {
    return <h2 className="!mb-2 !mt-8 text-lg font-semibold text-gray-900 first:!mt-0 dark:text-gray-100">{children}</h2>;
}

export default function Privacy() {
    return (
        <>
            <Head title="Privacy Policy" />
            <LegalPageLayout title="Privacy Policy" updatedAt="July 2026">
                <p>
                    This Privacy Policy explains what information Synkro collects when you use the platform,
                    how it is used, and the choices you have. Synkro was built as a school (PFA) project at
                    Kernel Solution &amp; Innovation, and this policy describes how the application actually
                    behaves rather than a generic legal template.
                </p>

                <H2>Information we collect</H2>
                <ul className="list-disc space-y-1.5 pl-5">
                    <li>Account details you provide: name, email address, and password (stored as a salted hash, never in plain text).</li>
                    <li>Content you create: projects, tasks, comments, notes, and any files or links you attach as deliverables.</li>
                    <li>Sign-in activity: timestamp, approximate location, browser, and device, so you can review your own login history and be alerted to unfamiliar sign-ins.</li>
                    <li>Notification preferences and reminders you set up.</li>
                    <li>Support tickets and suspension appeals you submit, along with any admin responses.</li>
                </ul>

                <H2>How we use it</H2>
                <p>
                    Your information is used to operate the core features of Synkro: showing your projects and
                    tasks, delivering in-app and email notifications you've opted into, powering your personal
                    dashboard, and letting administrators moderate the platform (for example, reviewing support
                    tickets or handling suspension appeals). We do not sell your data or use it for advertising.
                </p>

                <H2>Third-party services</H2>
                <p>
                    Synkro relies on a small number of third-party services to function: an email provider to
                    deliver notification emails, and a WebSocket broadcasting service to deliver real-time
                    updates (like live notifications and dashboard activity) to your browser. These providers
                    process the minimum data needed to deliver those messages.
                </p>

                <H2>Data retention and deletion</H2>
                <p>
                    You can request deletion of your account at any time from Account Settings. Deletion
                    requires confirming via a link sent to your email before it takes effect, and is permanent
                    once confirmed. Some records, such as the administrative audit log, may be retained in
                    de-identified or aggregate form for platform integrity.
                </p>

                <H2>Your choices</H2>
                <p>
                    You control which email notifications you receive from Settings, can review and revoke
                    trusted external links from your account, and can view your own login history at any time.
                </p>

                <H2>Contact</H2>
                <p>
                    Questions about this policy can be sent through the in-app Feedback form, which reaches
                    the Synkro team directly.
                </p>
            </LegalPageLayout>
        </>
    );
}
