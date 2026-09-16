# Synkro, Defense Speech
### Timed for ~15 minutes across 19 slides (read at a calm, natural pace, not rushed)

---

## Slide 1, Cover
Good morning everyone. My name is Adem Ouerhani, and I'm going to be presenting the work I did during my end-of-year internship, where I designed and built Synkro, a collaborative project and task management platform. This internship was carried out at Kernel Solution & Innovation, under the supervision of Mr. Mkaissi Khalil, as part of my Licence in Génie Logiciel et Systèmes d'Information here at ISLAIB.

## Slide 2, Agenda
Here's how I'll walk through this. I'll start with the context: the company, the market, and the problem I set out to solve. Then I'll cover the solution and the methodology I used to build it. After that, I'll go through the four development sprints one by one. Then I'll show you the architecture and where the platform stands today. And I'll close with what I learned, the challenges I ran into, and where Synkro could go from here.

## Slide 3, Kernel Solution & Innovation
I did this internship at Kernel Solution & Innovation, a digital agency in Hammam-Lif with over seven years of experience delivering software, mobile apps, web design, and digital marketing for clients. What made this internship a bit different is that it was entirely self-directed. I picked my own topic, I designed the product, and I built it myself, under the professional supervision of the agency's CEO, but with full autonomy over the technical direction. I followed the agency's own Agile delivery culture throughout: planning, development, testing, and launch, repeated every sprint.

## Slide 4, A gap in existing project management tools
Before deciding what to build, I looked at what already exists. Tools like Trello, Asana, Jira, and ClickUp are all solid products, but each one makes a trade-off. Trello and Asana are simple and fast, but they don't give you much control over roles. Jira and ClickUp give you that control, but they come with a steep learning curve and a lot of overhead for a small team. None of them really combine simplicity, true real-time collaboration, and fine-grained role control in one lightweight package. That gap is exactly what I wanted Synkro to fill.

## Slide 5, Introducing Synkro
So, Synkro. It's a collaborative web platform where teams create projects, assign role-based responsibilities, move tasks through a clear status workflow, and stay instantly informed about what's happening. Every project has role-aware members: an owner, managers, members, and testers, each with a different scope of what they can see and do. Tasks follow a full lifecycle with checklists and deliverables attached. Every meaningful event, a task update, a comment, an invitation, is pushed live through WebSockets, so nobody has to refresh the page to see what changed. And on top of all that sits a full administration and moderation layer. All of this was built solo, in seven weeks.

## Slide 6, Objectives
Going in, I set myself five concrete objectives. First, deliver a complete, usable platform within the seven-week internship window. Second, build fine-grained, role-based access control so every project member only sees and does what their role allows. Third, deliver genuine real-time collaboration through WebSockets, not just polling or manual refreshing. Fourth, build out administration and moderation tooling so the platform stays healthy as it grows. And fifth, and this one mattered a lot to me personally, run the internship itself as a disciplined, Agile, sprint-based process, not just the product, but the way I worked.

## Slide 7, Actors & roles
Synkro distinguishes six roles across two levels. At the project level, you have the Owner, who has full control including archiving and role management; the Manager, who creates and assigns tasks and manages members; the Member, who works on assigned tasks and checklists; and the Tester, who validates submitted work but with restricted permissions, they can't edit content, only approve or reject it. At the platform level, you have the Administrator, who moderates users and handles support tickets and appeals, and the Superadmin, who sits above that, with the power to promote or demote users, edit core user information, and delete accounts outright.

## Slide 8, Requirements specification
I split the requirements into functional and non-functional. On the functional side: registration and session management, profile and theme settings, project creation with invitations and roles, the full task lifecycle with checklists and deliverables, comments and real-time notifications, and on the admin side, user management, suspension appeals, and analytics. On the non-functional side, I focused on usability, a clean UI that works on desktop and mobile, performance, real-time updates with minimal latency, security, every sensitive action gated behind role-based authorization, and maintainability, keeping a clean MVC separation and a normalized data model.

## Slide 9, Methodology & tech stack
For methodology, I acted as both the sole developer and the de facto product owner. I ran one planning sprint, Sprint 0, followed by four development sprints, and every single one of them shipped a working, demonstrable increment. Before writing any code for a given area, I modeled it with UML: use case diagrams, sequence diagrams, and class diagrams, you can see the general use case diagram for the whole system right here, with the full actor hierarchy from Guest all the way up to Superadmin. On the technical side, the stack is Laravel 13 on the backend, React with Inertia.js on the frontend, so no separate REST API layer, Laravel Reverb for the WebSocket server, Tailwind CSS for styling, MySQL for the database, and Recharts for the analytics visualizations.

## Slide 10, Sprint planning
The internship ran for exactly seven full working weeks, from June 15th to July 31st. I split that into one planning sprint and four development sprints. Sprint 1 and Sprint 2 got two weeks each, because authentication and, especially, project and task management, form the functional core of the whole application, and I wanted a solid, well-tested foundation there. Sprint 3 and Sprint 4 got one week each, since real-time collaboration and the admin layer build on top of that core rather than replacing it.

## Slide 11, Sprint 1: Authentication & User Management
Sprint 1 covered authentication and user management. This includes registration with e-mail verification, login and logout, password reset, and full profile management. I also built light, dark, and black appearance themes, a live list of active sessions so users can see and disconnect their own logged-in devices, and account deactivation that automatically reactivates the moment the user logs back in, with an on-page restore prompt if someone tries to log into a deleted account. By the end of this sprint, Synkro had a complete, secure account system that everything else in the platform would build on top of.

## Slide 12, Sprint 2: Project & Task Management
Sprint 2 is really the heart of Synkro. This is where project creation, invitations, and role assignment come in, along with the full task lifecycle: To Do, In Progress, Submitted, In Review, Done, with a tester approval gate built in. Tasks can carry checklists and file or link deliverables, and everything shows up live on a Kanban-style board. I also built a Testing Queue for reviewers, a personal "My Tasks" view with pinning and archiving, and bulk actions so managers and reviewers aren't clicking one task at a time. From this point on in the internship, a team could realistically plan and track its work from start to finish.

## Slide 13, Sprint 3: Real-Time Collaboration
Sprint 3 is where the platform actually starts to feel alive. I added task comments with structured reviewer feedback, and every one of these events, a comment, a status change, an invitation, gets pushed instantly over WebSockets rather than waiting for a page refresh. I also built personal notes, shared project resources, a full project activity log for accountability, and per-project and per-task notification muting so people aren't overwhelmed. This sprint also introduced the personal dashboard, which gives every user one place to see their stats, activity trends, and upcoming deadlines, along with configurable per-task deadline reminders.

## Slide 14, Sprint 4: Administration & Analytics
The fourth and final development sprint closed out the platform with a full moderation and oversight layer. Administrators can manage users, promote or demote them, and there's a complete suspension workflow with a formal appeal process on the user's side. I built a feedback and support ticket system, and a platform-wide analytics dashboard for admins to keep an eye on overall health. This is also where I added a public landing page and the Terms of Use and Privacy Policy pages, so the project has a proper front door, not just a login screen.

## Slide 15, Technical architecture
Here's how it all fits together technically. On the client side, the browser runs React with Inertia.js and Tailwind CSS. Requests go through Laravel 13 controllers and policies, which route into the application services layer, handling notifications, logs, and scheduled jobs. That layer talks to two places: Eloquent ORM down to a MySQL database, and a broadcast events system that either goes out through Laravel Reverb as a live WebSocket push to connected clients through Laravel Echo, or through a mail queue for e-mail notifications. It's a fairly clean separation: real-time state changes go one way, persistent data goes another, and they meet in the application services layer.

## Slide 16, Skills gained & challenges faced
On the skills side, this internship gave me a real, practical grip on the full Laravel ecosystem, policies, jobs, scheduling, on building with React and Inertia without a separate REST layer, on real-time systems with WebSockets, and on relational data modelling at a scale I hadn't worked at before. It wasn't without its challenges, though. Coordinating real-time updates without duplicating events took real care. Designing a role-based access model that was flexible but still simple to reason about took several iterations before it clicked. And prioritizing scope within a fixed seven-week window meant constantly saying no to good ideas so I could ship the essential ones. And, of course, running my own Agile process end to end, being both the developer and the product owner, was a challenge and a lesson in itself.

## Slide 17, Future perspectives
Looking ahead, there are a number of directions I'd want to take Synkro in. Stronger authentication, two-factor and CAPTCHA, plus Google sign-in. A dedicated user profile, separate from account settings. A full messaging system: direct messages, per-project group chat, and admin broadcasts, along with an in-app chatbot to help users navigate the platform. On the moderation side, graduated warnings before a suspension. A global search bar across users, projects, and tasks. The ability to make a project open source and showcase it on a public profile. Custom, configurable project roles instead of the four fixed ones. And finally, letting superadmins broadcast system-wide announcements to everyone on the platform.

## Slide 18, Conclusion
So, to bring it all together. Synkro meets every objective I set out at the start of this internship: role-aware collaboration, genuine real-time updates, and a full administration layer, all delivered through a disciplined, sprint-based process, from the very first requirement to a working, demonstrable product. But honestly, I think the real value of this internship goes beyond the application itself. It was a complete, hands-on exercise in software engineering, not just building a product, but building the judgment that comes from shipping something real, alone, under real constraints of time and scope.

## Slide 19, Thank you
Thank you very much for your attention. I'd be happy to answer any questions you have.

---

### Delivery notes
- Total script is roughly 1,900 words. At a calm, natural pace (about 130-140 words per minute) that lands around 13 to 14 minutes, leaving room for slide transitions, pauses, and a breath before questions. That fits comfortably inside the 15 ± 3 minute window, and even gives you a little room to slow down further if you want.
- Slides 11 to 14 (the four sprints) are the densest. If you're running long during rehearsal, those are the safest places to trim a sentence or two, since the report and slides already carry the full detail.
- Slide 9 and slide 15 are the two most technical moments. Slow down slightly there rather than rushing through the acronyms.
- If you want a concrete number to anchor the audience partway through, the admin dashboard screenshot on slide 14 already shows live platform stats, you can call one or two of them out in passing without needing a dedicated slide for it.
