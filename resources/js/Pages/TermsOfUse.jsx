import LegalPageLayout from '@/Components/LegalPageLayout';
import { Head } from '@inertiajs/react';

function H2({ children }) {
    return <h2 className="!mb-2 !mt-8 text-lg font-semibold text-gray-900 first:!mt-0 dark:text-gray-100">{children}</h2>;
}

export default function TermsOfUse() {
    return (
        <>
            <Head title="Terms of Use" />
            <LegalPageLayout title="Terms of Use" updatedAt="July 2026">
                <p>
                    These Terms of Use govern your access to and use of Synkro. By creating an account, you
                    agree to these terms. Synkro was built as a school (PFA) project at Kernel Solution &amp;
                    Innovation.
                </p>

                <H2>Your account</H2>
                <p>
                    You're responsible for the security of your own account, including keeping your password
                    confidential and reviewing your login history for anything unfamiliar. You must provide
                    accurate information when registering and keep it up to date.
                </p>

                <H2>Acceptable use</H2>
                <ul className="list-disc space-y-1.5 pl-5">
                    <li>Don't use Synkro to upload, link to, or share unlawful, abusive, or infringing content.</li>
                    <li>Don't attempt to access another user's account or data you're not a member of.</li>
                    <li>Don't attempt to disrupt or overload the platform's infrastructure.</li>
                    <li>Respect other members within shared projects: comments and feedback should stay on-topic and respectful.</li>
                </ul>
                <p>
                    Accounts that violate these terms may be suspended. Suspended users can appeal the decision
                    through the built-in appeals process, which an administrator will review.
                </p>

                <H2>Your content</H2>
                <p>
                    You retain ownership of the projects, tasks, comments, and files you create in Synkro.
                    You're solely responsible for the content you upload or link to, and for having the rights
                    to share it with your project's other members.
                </p>

                <H2>Account suspension and termination</H2>
                <p>
                    Synkro administrators may suspend an account, temporarily or permanently, for violations of
                    these terms. You may also delete your own account at any time from Account Settings, which
                    requires email confirmation before it takes effect.
                </p>

                <H2>No warranty</H2>
                <p>
                    Synkro is provided as a student project, on an "as is" basis, without warranties of any
                    kind. While reasonable care has gone into its design, no guarantee is made regarding
                    uptime, data durability, or fitness for any particular purpose.
                </p>

                <H2>Changes to these terms</H2>
                <p>
                    These terms may be updated from time to time as the platform evolves. Continued use of
                    Synkro after a change constitutes acceptance of the updated terms.
                </p>

                <H2>Contact</H2>
                <p>
                    Questions about these terms can be sent through the in-app Feedback form.
                </p>
            </LegalPageLayout>
        </>
    );
}
