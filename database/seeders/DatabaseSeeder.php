<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Feedback;
use App\Models\FeedbackResponse;
use App\Models\Project;
use App\Models\ProjectNote;
use App\Models\ProjectResource;
use App\Models\Reminder;
use App\Models\SuspensionAppeal;
use App\Models\Task;
use App\Models\TaskChecklistItem;
use App\Models\TaskDeliverable;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@synkro.test',
            'role' => 'admin',
        ]);

        // Named rather than fake()'d so project/task ownership below reads clearly
        // instead of juggling an anonymous $users[3].
        $alice = User::factory()->create(['name' => 'Alice Chen', 'email' => 'alice@synkro.test']);
        $ben = User::factory()->create(['name' => 'Ben Okafor', 'email' => 'ben@synkro.test']);
        $chloe = User::factory()->create(['name' => 'Chloe Martin', 'email' => 'chloe@synkro.test']);
        $dev = User::factory()->create(['name' => 'Dev Patel', 'email' => 'dev@synkro.test']);
        $erin = User::factory()->create(['name' => 'Erin Walsh', 'email' => 'erin@synkro.test']);

        User::factory(3)->create(); // a few extra unattached accounts, useful for invite/search flows

        // --- Project 1: Website Redesign (Alice owns, mixed roster, active work) ---
        $website = Project::create([
            'name' => 'Website Redesign',
            'description' => 'Refresh the marketing site: new homepage, pricing page, and a proper design system.',
            'owner_id' => $alice->id,
        ]);
        $website->members()->attach([
            $alice->id => ['role' => 'owner'],
            $ben->id => ['role' => 'manager'],
            $chloe->id => ['role' => 'member'],
            $dev->id => ['role' => 'member'],
            $erin->id => ['role' => 'tester'],
        ]);

        $homepage = Task::create([
            'project_id' => $website->id,
            'title' => 'Design new homepage hero section',
            'description' => 'Explore 2-3 directions for the hero: headline, supporting copy, and a product screenshot or short clip.',
            'status' => 'in_review',
            'priority' => 'high',
            'assigned_to' => $chloe->id,
            'due_date' => now()->addDays(3),
            'submitted_at' => now()->subHours(6),
            'review_started_at' => now()->subHours(2),
        ]);
        TaskChecklistItem::create(['task_id' => $homepage->id, 'title' => 'Draft 3 headline options', 'done' => true, 'position' => 0, 'created_by' => $chloe->id]);
        TaskChecklistItem::create(['task_id' => $homepage->id, 'title' => 'Get copy reviewed by Ben', 'done' => true, 'position' => 1, 'created_by' => $chloe->id]);
        TaskChecklistItem::create(['task_id' => $homepage->id, 'title' => 'Export final assets at 2x', 'done' => false, 'position' => 2, 'created_by' => $chloe->id]);
        TaskDeliverable::create(['task_id' => $homepage->id, 'type' => 'link', 'title' => 'Figma mockup', 'url' => 'https://figma.com/file/example-homepage']);
        Comment::create(['task_id' => $homepage->id, 'user_id' => $chloe->id, 'body' => "Went with the product-screenshot direction, feels the most concrete. Let me know what you think."]);
        Comment::create(['task_id' => $homepage->id, 'user_id' => $erin->id, 'body' => 'Looks great on desktop, want to double check the mobile crop before this goes further.']);

        $pricing = Task::create([
            'project_id' => $website->id,
            'title' => 'Build pricing page',
            'description' => 'Three-tier pricing table with a monthly/annual toggle.',
            'status' => 'in_progress',
            'priority' => 'medium',
            'assigned_to' => $dev->id,
            'due_date' => now()->addDays(7),
        ]);
        TaskChecklistItem::create(['task_id' => $pricing->id, 'title' => 'Wire up annual/monthly toggle', 'done' => false, 'position' => 0, 'created_by' => $dev->id]);
        $pricing->dependencies()->attach($homepage->id);

        Task::create([
            'project_id' => $website->id,
            'title' => 'Set up design tokens in Figma',
            'status' => 'todo',
            'priority' => 'low',
            'due_date' => now()->addDays(14),
        ]);

        $oldNav = Task::create([
            'project_id' => $website->id,
            'title' => 'Old nav component cleanup',
            'status' => 'done',
            'priority' => 'low',
            'assigned_to' => $dev->id,
            'submitted_at' => now()->subDays(4),
        ]);
        Comment::create(['task_id' => $oldNav->id, 'user_id' => $ben->id, 'body' => 'Approved, nice cleanup.', 'is_feedback' => true]);

        ProjectResource::create([
            'project_id' => $website->id,
            'user_id' => $alice->id,
            'type' => 'link',
            'name' => 'Brand guidelines',
            'description' => 'Logo usage, color palette, and type scale.',
            'url' => 'https://www.figma.com/file/example-brand-guidelines',
        ]);
        ProjectNote::create([
            'project_id' => $website->id,
            'user_id' => $alice->id,
            'title' => 'Launch checklist',
            'content' => [
                ['id' => 1, 'text' => 'Confirm final copy with marketing', 'done' => false, 'checklist_item_id' => null],
                ['id' => 2, 'text' => 'Schedule the announcement post', 'done' => false, 'checklist_item_id' => null],
            ],
        ]);

        // --- Project 2: Mobile App Beta (Ben owns, smaller roster, earlier stage) ---
        $mobile = Project::create([
            'name' => 'Mobile App Beta',
            'description' => 'Get the iOS beta ready for a closed TestFlight group.',
            'owner_id' => $ben->id,
        ]);
        $mobile->members()->attach([
            $ben->id => ['role' => 'owner'],
            $dev->id => ['role' => 'member'],
            $erin->id => ['role' => 'tester', 'pinned' => true],
        ]);

        $crashFix = Task::create([
            'project_id' => $mobile->id,
            'title' => 'Fix crash on cold start (iOS 18)',
            'description' => "Reported by two beta testers, doesn't reproduce on iOS 17.",
            'status' => 'submitted',
            'priority' => 'high',
            'assigned_to' => $dev->id,
            'due_date' => now()->subDay(),
            'overdue_notified_at' => now()->subHours(20),
            'submitted_at' => now()->subHours(1),
        ]);
        Comment::create(['task_id' => $crashFix->id, 'user_id' => $dev->id, 'body' => 'Traced it to a nil unwrap in the onboarding flow, fix is up for review.']);

        $onboarding = Task::create([
            'project_id' => $mobile->id,
            'title' => 'Polish onboarding flow',
            'status' => 'in_review',
            'priority' => 'medium',
            'assigned_to' => $dev->id,
            'submitted_at' => now()->subDays(1),
            'review_started_at' => now()->subHours(10),
        ]);
        Comment::create([
            'task_id' => $onboarding->id,
            'user_id' => $ben->id,
            'body' => 'The third screen still reads a bit dense, can we cut it down to one sentence?',
            'is_feedback' => true,
            'is_rejection' => true,
        ]);

        Task::create([
            'project_id' => $mobile->id,
            'title' => 'Write TestFlight release notes',
            'status' => 'todo',
            'priority' => 'low',
            'due_date' => now()->addDays(5),
        ]);

        // --- Project 3: Internal Tools (Chloe owns, archived - exercises that state) ---
        $internal = Project::create([
            'name' => 'Internal Tools Cleanup',
            'description' => 'One-off project for retiring a few old admin scripts.',
            'owner_id' => $chloe->id,
            'is_archived' => true,
        ]);
        $internal->members()->attach([
            $chloe->id => ['role' => 'owner'],
            $alice->id => ['role' => 'member', 'archived' => true],
        ]);
        Task::create([
            'project_id' => $internal->id,
            'title' => 'Decommission old CSV export script',
            'status' => 'done',
            'assigned_to' => $chloe->id,
        ]);

        // --- Reminders ---
        Reminder::create([
            'user_id' => $alice->id,
            'title' => 'Ping design team about hero section feedback',
            'remind_at' => now()->addHours(4),
        ]);
        Reminder::create([
            'user_id' => $ben->id,
            'title' => 'Weekly project status check-in',
            'remind_at' => now()->addDay(),
            'repeat_interval' => 'weekly',
        ]);

        // --- Feedback tickets (guest-submitted, no auth required) ---
        $bugTicket = Feedback::create([
            'name' => 'Jordan Rivera',
            'email' => 'jordan@example.com',
            'category' => 'bug',
            'subject' => 'Notification bell shows wrong count',
            'message' => "The bell badge says 3 but there's only 1 unread notification when I open it.",
            'status' => 'reviewing',
        ]);
        FeedbackResponse::create([
            'feedback_id' => $bugTicket->id,
            'admin_id' => $admin->id,
            'sender_type' => 'admin',
            'message' => "Thanks for flagging this, we can reproduce it and are looking into a fix.",
        ]);

        Feedback::create([
            'name' => 'Sam Lee',
            'email' => 'sam@example.com',
            'category' => 'suggestion',
            'subject' => 'Dark mode for the mobile app',
            'message' => 'Would love a dark theme option, the web app already has one.',
            'status' => 'pending',
        ]);

        // --- One suspended-account scenario, so the appeal review flow has data ---
        $suspended = User::factory()->create([
            'name' => 'Marcus Young',
            'email' => 'marcus@synkro.test',
            'is_suspended' => true,
            'suspended_until' => now()->addDays(3),
            'suspension_reason' => 'Repeated spam links posted in task comments.',
            'suspended_by' => $admin->id,
        ]);
        SuspensionAppeal::create([
            'user_id' => $suspended->id,
            'message' => "Those links were for a shared client asset, not spam, happy to explain further.",
            'status' => 'pending',
        ]);
    }
}
