# Synkro, Defense Speech
### Target: about 9 minutes (hard limit: 10 minutes, then 10 minutes of questions). Written to be spoken, not read word for word. Matches the 26-slide deck.

## Slide 1, Cover
[The jury member welcomes you and gives you the word. Stand straight, smile, and wait for them to finish before you start.]

Thank you very much, and good morning, members of the jury. Thank you for welcoming me. I'm Adem Ouerhani, a student in the Licence in Software Engineering at ISLAIB. Today I present my end-of-year internship project: Synkro, a platform that helps teams manage their projects and tasks. I did it at Kernel Solution & Innovation, under the supervision of Mr. Mkaissi Khalil.

## Slide 2, Outline
The plan is simple: the context and the problem, the solution, the design, the realisation, and the conclusion.

## Slide 3, Context
Today, most teams work on many tasks in parallel, often remotely. Two questions matter every day: who is doing what, and where does each task stand? Existing tools answer them badly for small teams. Some are too basic, others too heavy. The result is unclear responsibilities, forgotten tasks and slow feedback.

## Slide 4, Host organization
I did my internship at Kernel Solution & Innovation, a digital agency in Hammam-Lif with more than seven years of experience. They work in an Agile way. My internship was self-directed: I chose the topic, designed the product and built it myself, under the supervision of the CEO.

## Slide 5, Problem statement
I see four problems. Simple tools like Trello have basic roles. Complete tools like Jira or ClickUp are heavy to learn. Real-time collaboration is limited in most of them. And it's hard to see who owns a task and who must validate it.

## Slide 6, Existing tools
This table compares four tools with Synkro. Simple tools sacrifice roles and real-time, and complete tools become heavy. Synkro targets that gap: simple and fast, true real-time, and four granular roles.

## Slide 7, Solution
My solution is Synkro, a collaborative web platform built on four ideas: role-aware projects, a complete task lifecycle with a review step, real-time updates through WebSockets, and an administration layer. I built it alone, in seven weeks.

## Slide 8, Objectives
It has five objectives: a simple and lightweight tool, access control by role, true real-time collaboration, a clear follow-up of every task, and administration tools to keep the platform healthy.

## Slide 9, Methodology
For the design, I used an Agile method inspired by Scrum. I was the only developer, so also the product owner. One planning sprint, then four development sprints. In each one: UML modelling, development, then testing, and a working increment at the end.

## Slide 10, Sprint planning
The internship lasted seven weeks, from June 15 to July 31. Sprints 1 and 2, authentication and projects with tasks, took two weeks each because they are the core. Sprints 3 and 4, real-time and administration, took one week each because they build on that core.

## Slide 11, Actors and functional needs
There are two levels of roles. In a project: the owner has full control, the manager creates and assigns tasks, the member works on them, and the tester validates the submitted work: they can only approve or reject, not edit. At platform level: the administrator moderates users and handles tickets, and the superadmin manages roles and accounts. Every sensitive action is checked against these roles.

## Slide 12, Non-functional requirements
For the non-functional side, I focused on usability, with a responsive interface and three themes, performance through real-time updates, security through role-based authorization, and maintainability with a clean MVC structure.

## Slide 13, General use case diagram
[Point at the screen, pause two seconds.] This is the general use case diagram. All the roles I just described are modelled here.

## Slide 14, Core classes
[Point at User in the middle.] These are the core classes. I put User in the middle because everything connects to it. A project has one owner and several members, all users. The ProjectMember class holds each member's role: owner, manager, member or tester. [Point right.] A project has many tasks, and a task can be assigned to one user. A task has a status, from to do to done, and a priority, and it can depend on other tasks. It contains checklist items, deliverables and comments. This model is what makes the role-based workflow possible.

## Slide 15, Sequence diagram "Log in"
[Follow the arrows from top to bottom.] This is the login sequence. The user sends their email and password. The system validates them and checks the attempt limit, then asks the database for the account. Then four outcomes: wrong credentials or too many attempts give an error; a suspended account or an expired temporary password signs the user out with a notice; otherwise the login is logged and the user reaches the dashboard.

## Slide 16, Technologies
Now the realisation. Laravel 13 for the backend, React with Inertia.js for the interface, so no separate REST API, Tailwind CSS for the styling, MySQL for the database, and Laravel Reverb for the WebSockets.

## Slide 17, Public landing page
Here is the result. The public landing page presents the platform, and anyone can send feedback to the administrators, even without an account.

## Slide 18, Sprint 1: Authentication
Sprint 1 gave me a complete and secure account system: registration with email verification, login, password reset, profile, three themes, active sessions, automatic reactivation of a deactivated account, and restore of a deleted one.

## Slide 19, Sprint 2: Projects and tasks
Sprint 2 is the heart of Synkro: projects, invitations, roles, and the task lifecycle. After a member submits a task, a reviewer approves it or sends it back. Everything appears on a Kanban board that updates live. After this sprint, a team could already plan and follow its work.

## Slide 20, Sprint 3: Real-time collaboration
In Sprint 3, the platform came alive. Comments with structured feedback, and notifications pushed instantly through WebSockets. I also added an activity log per project, muting options, a personal dashboard, and deadline reminders.

## Slide 21, Sprint 4: Administration
Sprint 4 was administration: user management, a suspension process with a formal appeal, a support ticket system, and temporary passwords that must be changed at the next login.

## Slide 22, Admin analytics dashboard
[Point at one number.] The analytics dashboard gives administrators platform-wide numbers about users, projects and tasks at a glance.

## Slide 23, Skills gained and challenges
I gained real skills in the Laravel ecosystem, in React with Inertia, in real-time systems, and in relational modelling. The challenges were avoiding duplicated real-time events, keeping the role system flexible but simple, limiting the scope to seven weeks, and managing my own Agile process.

## Slide 24, Objectives met
To conclude, Synkro meets its objectives: role-based collaboration, real-time updates and an administration layer, delivered sprint by sprint. This internship taught me how to ship something real, alone, with a deadline. The code is public on GitHub.

## Slide 25, Future perspectives
For the future: two-factor authentication and Google sign-in, direct messages and project chat, warnings before suspension, a global search across users, projects and tasks, and custom roles.

## Slide 26, Thank you
Thank you for your attention. I thank Mr. Khalil and everyone at Kernel Solution & Innovation, and my teachers at ISLAIB. I'm ready for your questions.

---
