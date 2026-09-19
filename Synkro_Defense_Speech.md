# Synkro, Defense Speech
### Target: about 14 to 15 minutes (the slot is 15 ± 3). Written to be spoken, not read word for word.

---

## Slide 1, Cover
Good morning everyone. My name is Adem Ouerhani. Today I'm going to present my end-of-year internship project, Synkro, a platform that helps teams manage their projects and tasks. I did this internship at Kernel Solution & Innovation, supervised by Mr. Mkaissi Khalil, as part of my Licence in Génie Logiciel et Systèmes d'Information at ISLAIB.

## Slide 2, Agenda
I'll go through five parts. First, the context: the company, and the problem I wanted to solve. Second, the solution and the way I worked. Third, the four sprints. Fourth, the architecture and what the platform looks like today. And last, what I learned, what was difficult, and what I would add next.

## Slide 3, Kernel Solution & Innovation
I did the internship at Kernel Solution & Innovation, a digital agency in Hammam-Lif. They have more than seven years of experience. They build software, mobile apps and websites, and they do digital marketing for their clients. My internship was self-directed. I chose the topic, I designed the product, and I built it myself. The agency's CEO supervised me, but the technical choices were mine. I also followed the way the agency works: plan, develop, test, launch. I repeated that cycle in every sprint.

## Slide 4, A gap in existing project management tools
Before building anything, I looked at the tools teams already use: Trello, Asana, Jira and ClickUp. They are good tools, but each one has a weak point. Trello and Asana are easy to use, but their roles are basic. Jira and ClickUp have strong roles, but they take time to learn, and they are heavy for a small team. I couldn't find one tool that is simple, has real-time collaboration, and gives precise control over roles. That is the gap Synkro is made for.

## Slide 5, Introducing Synkro
So, what is Synkro? It's a web platform where a team creates a project, gives people roles, and moves tasks through a clear workflow. Every member has a role in the project: owner, manager, member or tester, and each role can do different things. Tasks have checklists and deliverables. When something happens, like a comment, a status change or an invitation, everyone sees it right away through WebSockets. Nobody needs to refresh the page. On top of that, there is an admin part to moderate the platform. I built all of this alone, in seven weeks.

## Slide 6, Objectives
I started with five objectives. One: deliver a complete platform that people can really use, within the seven weeks. Two: control access by role, so each person only sees and does what their role allows. Three: real-time collaboration with WebSockets, not just refreshing the page. Four: admin and moderation tools, so the platform stays healthy as it grows. And five, which was important to me: work in an Agile way, with sprints. I wanted to manage my own work like a real project.

## Slide 7, Actors & roles
There are two levels of roles. Inside a project, there are four. The owner has full control of the project, including the roles. The manager creates and assigns tasks and manages the members. The member works on the tasks assigned to them. The tester checks the work that was submitted. A tester can only approve or reject, they cannot edit anything. Then, at the platform level, there are three. The user is any account by default. The administrator moderates users and handles support tickets and appeals. And the superadmin can promote or demote users, edit their information, and delete accounts.

## Slide 8, Requirements specification
I split the requirements in two groups. The functional ones describe what the system does. Users register, verify their e-mail, log in, and manage their profile and theme. They create projects, invite people and assign roles. They manage tasks with statuses, checklists and deliverables. They comment and get notifications in real time. And admins manage users, suspension appeals and analytics. The non-functional ones describe how the system should behave. It has to be easy to use on desktop and mobile. It has to be fast, with real-time updates. It has to be secure, so every sensitive action is checked against the user's role. And it has to be easy to maintain, with a clean MVC structure and a normalized database.

## Slide 9, Methodology & tech stack
About my method. I was the only developer, and I was also the product owner. I worked with one planning sprint, Sprint 0, then four development sprints. Each sprint ended with something that worked and that I could demonstrate. Before coding each part, I modeled it with UML: use case, sequence and class diagrams. On this slide you can see the general use case diagram of the whole system. For the technology, I used Laravel 13 for the backend, and React with Inertia.js for the frontend, so I didn't need a separate REST API. Then Laravel Reverb for the WebSockets, Tailwind CSS for the styling, MySQL for the database, and Recharts for the charts.

## Slide 10, Sprint planning
The internship lasted seven weeks, from June 15 to July 31. The first week was for planning. Then I had four sprints. Sprint 1 and Sprint 2 took two weeks each, because authentication and project and task management are the core of the application, and I wanted a solid base. Sprint 3 and Sprint 4 took one week each, because real-time and the admin part are built on top of that core.

## Slide 11, Sprint 1: Authentication & User Management
Sprint 1 was authentication and user management. Users can register with e-mail verification, log in, reset their password and manage their profile. I added three themes: light, dark and black. Users can also see their active sessions, so they know which devices are logged in. If someone deactivates their account, it is reactivated automatically when they log in again. And if someone tries to log into a deleted account, the page offers to restore it. After this sprint, I had a complete and secure account system to build on.

## Slide 12, Sprint 2: Project & Task Management
Sprint 2 is the heart of Synkro. It covers projects, invitations and roles, and the task lifecycle: To Do, In Progress, Submitted, In Review, and Done. There is an approval step. After a member submits a task, a reviewer approves it or sends it back. Tasks have checklists and deliverables, which can be files or links. Everything appears on a Kanban board that updates live for the whole team. I also built the Testing Queue for reviewers, a My Tasks page where users can pin and archive tasks, and bulk actions for managers and reviewers. After this sprint, a team could already plan and follow its work from start to finish.

## Slide 13, Sprint 3: Real-Time Collaboration
In Sprint 3, the platform started to feel alive. I added task comments, with structured feedback from reviewers. Comments, status changes and invitations are pushed instantly over WebSockets. I also added personal notes, shared project resources, and an activity log for each project, so it's clear who did what. Users can mute notifications per project or per task, so they aren't flooded. And there is a personal dashboard with activity charts and a calendar, plus reminders and deadline alerts on tasks.

## Slide 14, Sprint 4: Administration & Analytics
Sprint 4 was the last one: administration and analytics. Admins can manage users and promote or demote them. There is a suspension process, and a suspended user can send a formal appeal. I built a feedback and support ticket system, and an analytics dashboard where admins can follow the platform as a whole. On the screenshot, you can see some of the live statistics. I also added a public landing page with the Terms of Use and the Privacy Policy, so the project has more than a login screen.

## Slide 15, Technical architecture
This is how it works technically, from top to bottom. On the client side, the browser runs React with Inertia.js and Tailwind CSS. Requests go to Laravel controllers and policies, and the policies check what each role is allowed to do. Then the application services handle notifications, logs and scheduled jobs. From there, the data goes two ways. Persistent data goes through Eloquent to the MySQL database. Events are broadcast, and depending on the user's notification preferences, they become either a live push through Laravel Reverb and Echo, or an e-mail in a queue. So real-time events and stored data follow different paths, and they meet in the services layer.

## Slide 16, Skills gained & challenges faced
First, the skills. I learned a lot about the Laravel ecosystem: policies, jobs and scheduling. I learned to use React with Inertia without a separate REST API, how real-time systems work with WebSockets, and how to model relational data on a bigger platform than I had done before. There were also challenges. The first was real-time updates. I had to make sure the same event wasn't sent twice. The second was the role system. I wanted it to be flexible but still easy to understand, and it took several attempts. The third was the scope. With only seven weeks, I had to say no to good ideas to finish the important ones. And managing my own Agile process, as developer and product owner, was a lesson in itself.

## Slide 17, Future perspectives
For the future, I have several ideas. For security: two-factor authentication, CAPTCHA and Google sign-in. A separate user profile page. A messaging system, with direct messages, a group chat for each project and admin broadcasts, and a chatbot to help users find their way. For moderation, warnings before a suspension. A global search across users, projects and tasks. The option to make a project open source and show it on a public profile. Custom roles for projects, instead of the four fixed ones. And system-wide announcements from the superadmin.

## Slide 18, Conclusion
To conclude. Synkro meets the objectives I set at the beginning: collaboration based on roles, real-time updates, and an admin layer. I delivered it with a sprint-based process, from the first requirement to a working product. For me, this internship was also a full experience of software engineering. I learned how to ship something real, alone, with a deadline and limited time.

## Slide 19, Thank you
Thank you for your attention. Before the questions, I would like to thank Mr. Mkaissi Khalil and everyone at Kernel Solution & Innovation for their trust and support, and my teachers at ISLAIB. I'm ready for your questions.

---

### Notes for practice
- The speech is about 1,650 words. At 120 to 130 words per minute, that's 13 to 14 minutes. Changing slides and pointing at things adds about a minute, so expect around 14 to 15 minutes. Even if you speak fast, you stay inside the 12 to 18 minute window.
- Time yourself out loud at least twice. If you're over 16 minutes, shorten the sprint slides (11 to 14) first. The slides and the report already have the details, so you can skip the smaller features there.
- If you're under 12 minutes, you're probably going too fast. Slow down on slides 9 and 15, which are the most technical.
- Since you're projecting on a whiteboard, point at the screen when you mention a diagram (slide 9) or the architecture (slide 15). It gives the jury time to look, and it gives you a pause.
- On slide 14, if you have a few seconds, point at one or two numbers on the analytics screenshot.
- Don't memorize the text. Learn the order of ideas for each slide and say it in your own words. It will sound more natural, and it's easier if you lose your place.
