# LMS Admin Panel - Implementation Plan

## Overview
This document outlines the implementation plan for five interconnected features:
1. **Teacher Availability Management** during scheduling
2. **Student Board Selection** during registration
3. **Free Demo Student Tracking** 
4. **Free Demo Class Planning**
5. **Free Demo Schedule Management**

---

## Phase 1: Database Schema Updates

### 1.1 Teacher Availability Table
**Purpose**: Track teacher availability/unavailability for specific dates

```
TABLE: teacher_availability (or unavailability)
├── id (UUID)
├── teacherId (FK → User)
├── date (DATE)
├── day (VARCHAR) - e.g., "Monday", "Tuesday"
├── isAvailable (BOOLEAN)
├── reason (VARCHAR) - why unavailable (optional)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

UNIQUE INDEX: teacher_availability_unique(teacherId, date)
```

### 1.2 Update User Table
**Purpose**: Add board preference to User model

```
ALTER TABLE users ADD COLUMN:
├── boardType (ENUM: 'STATE_BOARD', 'CBSE', null) 
├── isFreeDemoStudent (BOOLEAN, DEFAULT: false)
├── isFreeDemoEnrolled (BOOLEAN, DEFAULT: false)
```

### 1.3 Free Demo Class Table
**Purpose**: Separate tracking for free demo classes

```
TABLE: free_demo_classes
├── id (UUID)
├── classId (FK → Batch/LiveSession - nullable)
├── name (VARCHAR)
├── courseId (FK → Course)
├── courseCategory (VARCHAR) - e.g., 'Foundation', 'Standard', 'Advanced'
├── capacity (INT)
├── enrolledCount (INT, DEFAULT: 0)
├── startDate (DATE)
├── endDate (DATE)
├── status (ENUM: 'planned', 'active', 'completed', 'cancelled')
├── notes (TEXT)
├── createdBy (FK → User/Admin)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)
```

### 1.4 Free Demo Schedule Table
**Purpose**: Track individual demo class schedules

```
TABLE: free_demo_schedules
├── id (UUID)
├── freeDemoClassId (FK → free_demo_classes)
├── date (DATE)
├── day (VARCHAR)
├── sessionId (FK → SessionSlot)
├── session (INT)
├── startTime (VARCHAR)
├── endTime (VARCHAR)
├── teacherId (FK → User)
├── teacherName (VARCHAR) - denormalized
├── topicName (VARCHAR)
├── meetingLink (VARCHAR)
├── status (ENUM: 'scheduled', 'live', 'completed', 'cancelled')
├── attendanceCount (INT)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)
```

### 1.5 Free Demo Enrollment Table
**Purpose**: Track which demo students enrolled in which free demo classes

```
TABLE: free_demo_enrollments
├── id (UUID)
├── freeDemoClassId (FK → free_demo_classes)
├── studentId (FK → User)
├── enrollmentStatus (ENUM: 'registered', 'attended', 'no-show')
├── enrolledAt (TIMESTAMP)
├── attendedAt (TIMESTAMP, nullable)
```

---

## Phase 2: Backend API Development

### 2.1 Teacher Availability APIs

**Endpoint**: `POST /api/teachers/{teacherId}/unavailability`
```javascript
Request: {
  date: "2025-03-25",
  day: "Tuesday",
  reason: "Personal Leave"  
}
Response: TeacherAvailability
```

**Endpoint**: `GET /api/teachers/{teacherId}/availability?month=2025-03`
```javascript
Response: TeacherAvailability[]
```

**Endpoint**: `GET /api/teachers/available?date=2025-03-25`
```javascript
Response: AvailableTeacher[] 
// Returns teachers available on specific date
```

**Endpoint**: `DELETE /api/teachers/{teacherId}/unavailability/{id}`

### 2.2 Enhanced Timetable/Scheduling APIs

**Modify**: `POST /api/livesession/timetable`
```javascript
Request: {
  batchId: "...",
  day: "Monday",
  session: 1,
  primaryTeacherId: "teacher-1",
  backupTeacherId: "teacher-2", // NEW: If primary unavailable
  scheduledDate: "2025-03-24",
  // ... existing fields
}
Response: TimetableSlot with conflict resolution info
```

**New Endpoint**: `POST /api/livesession/timetable/validate-teacher-availability`
```javascript
Request: {
  teacherId: "...",
  date: "2025-03-24"
}
Response: {
  isAvailable: boolean,
  reason?: string,
  suggestedAlternativeTeachers: UserRef[]
}
```

**New Endpoint**: `POST /api/batches/merge`
```javascript
Request: {
  primaryBatchId: "...",
  secondaryBatchId: "...",
  newBatchName: "...",
  reason: "teacher_unavailable"
}
Response: Batch
```

### 2.3 Student Board Selection APIs

**Modify**: `POST /api/auth/register` (Registration)
```javascript
Request: {
  // ... existing fields
  boardType: "CBSE" | "STATE_BOARD", // NEW
  // ... existing fields
}
```

**New Endpoint**: `PUT /api/users/{studentId}/board-preference`
```javascript
Request: {
  boardType: "CBSE" | "STATE_BOARD"
}
```

**New Endpoint**: `GET /api/batches/by-board/{boardType}`
```javascript
Response: Batch[]
// Returns batches filtered by board type
```

### 2.4 Free Demo Management APIs

**Endpoint**: `POST /api/free-demo-classes`
```javascript
Request: {
  name: "Free Math Demo Class",
  courseId: "...",
  courseCategory: "Foundation",
  capacity: 30,
  startDate: "2025-03-25",
  endDate: "2025-06-25",
  notes: "Introduction to Algebra"
}
Response: FreeDemoClass
```

**Endpoint**: `GET /api/free-demo-classes`
```javascript
Response: FreeDemoClass[] (with status, enrolled count, etc.)
```

**Endpoint**: `PUT /api/free-demo-classes/{id}`
```javascript
Request: Partial<FreeDemoClass>
```

**Endpoint**: `DELETE /api/free-demo-classes/{id}`

**Endpoint**: `POST /api/free-demo-classes/{id}/schedules`
```javascript
Request: {
  date: "2025-03-25",
  day: "Tuesday",
  sessionId: "...",
  teacherId: "...",
  topic: "Basics of Algebra",
  backupTeacherId?: "..." // Alternative if primary unavailable
}
Response: FreeDemoSchedule
```

**Endpoint**: `GET /api/free-demo-classes/{id}/schedules`
```javascript
Response: FreeDemoSchedule[]
```

**Endpoint**: `PUT /api/free-demo-schedules/{id}`
```javascript
Request: Partial<FreeDemoSchedule>
```

**Endpoint**: `DELETE /api/free-demo-schedules/{id}`

**Endpoint**: `POST /api/free-demo-classes/{id}/enroll`
```javascript
Request: {
  studentId: "..." OR empty (for registration flow)
}
Response: FreeDemoEnrollment
```

**Endpoint**: `GET /api/free-demo-classes/{classId}/enrollments`
```javascript
Response: FreeDemoEnrollment[]
```

**Endpoint**: `GET /api/students/free-demo`
```javascript
Response: User[] (students who registered as free-demo)
```

---

## Phase 3: Frontend Components

### 3.1 Teacher Availability Management Component

**Path**: `src/app/components/users/teachers/teacher-availability.component.ts`

**Features**:
- Calendar view showing teacher unavailability
- Mark specific dates as unavailable
- Bulk mark unavailable (date range)
- View all teachers' availability for a specific date
- Manage backup teachers

**Template structure**:
```
├── Calendar picker for unavailability dates
├── Day/date selector
├── Reason field
├── List of marked unavailable dates
├── Edit/Delete actions
└── Suggested backup teachers
```

### 3.2 Smart Scheduling Component (Enhanced)

**Path**: `src/app/components/learning/timetable/smart-scheduling.component.ts`

**New Features**:
- Validate teacher availability before assignment
- Auto-suggest backup teachers if primary unavailable
- Option to merge classes instead of finding alternative
- Conflict resolution UI with approval flow
- Preview schedule changes before saving

**Logic Flow**:
```
1. User selects teacher + date for class
2. System validates teacher availability
   ├─ If Available: Allow scheduling
   ├─ If Unavailable:
   │  ├─ Show backup teacher options
   │  ├─ Show class merge options
   │  └─ Let admin choose approach
3. Save with conflict resolution details
4. Notify affected parties
```

### 3.3 Enhanced Registration Component

**Path**: `src/app/components/registration/registration.component.ts` (Modified)

**New Fields**:
```
├── Role Selection (Teacher/Student/Parent)
├── For Students:
│  ├── Board Type Selection (NEW)
│  │  ├─ State Board
│  │  ├─ CBSE
│  │  └─ Other
│  ├── Is Free Demo Student? (NEW)
│  ├── Course Selection (filtered by board)
│  ├── Batch Selection (filtered by board)
│  └── Existing fields...
└── Payment processing
```

**Flow**:
```
1. User selects role
2. If Student:
   a. Select Board Type
   b. Apply board-specific filtering to courses/batches
   c. If selecting "Free Demo": Mark as free-demo student
   d. Complete registration
3. Send board_type to backend
```

### 3.4 Free Demo Management Component

**Path**: `src/app/components/learning/free-demo/free-demo-management.component.ts`

**Sub-components**:
- Free Demo Classes List view
- Create/Edit Free Demo Class modal
- Daily Schedule View for demos
- Student Enrollment Management

**Features**:
- CRUD for free demo classes
- View capacity vs enrolled count
- Status management (planned → active → completed)
- Note taking for class details
- Export enrollment lists

### 3.5 Free Demo Scheduling Component

**Path**: `src/app/components/learning/free-demo/free-demo-scheduling.component.ts`

**Features**:
- Calendar interface for scheduling demo sessions
- Date picker with time slot selection
- Teacher assignment with availability check
- Backup teacher option
- Topic/subject name input
- Auto-generate meeting link
- Status tracking (scheduled → live → completed)

**UI Structure**:
```
├── Free Demo Class Selection dropdown
├── Calendar Month picker
├── Click on date → Create Session modal
│  ├── Session time selection
│  ├── Teacher selection (with availability)
│  ├── Backup teacher (optional)
│  ├── Topic name
│  └── Save button
├── List view of scheduled sessions
└── Bulk actions (reschedule, cancel)
```

### 3.6 Free Demo Student Enrollment Component

**Path**: `src/app/components/learning/free-demo/free-demo-enrollment.component.ts`

**Features**:
- View all students registered as free-demo
- Filter by board type
- Assign to free demo classes
- Bulk enrollment
- View enrollment history
- Attendance tracking

---

## Phase 4: Service Layer

### 4.1 Teacher Availability Service

**Path**: `src/app/services/teacher-availability.service.ts`

```typescript
export class TeacherAvailabilityService {
  
  markUnavailable(teacherId: string, data: UnavailabilityData): Observable<TeacherAvailability>
  getAvailabilityForDate(date: Date): Observable<AvailableTeacher[]>
  getTeacherAvailability(teacherId: string, month?: string): Observable<TeacherAvailability[]>
  deleteUnavailability(teacherId: string, id: string): Observable<void>
  getSuggestedAlternatives(teacherId: string, date: Date): Observable<UserRef[]>
}
```

### 4.2 Enhanced Timetable Service

**Modify**: `src/app/services/timetable.service.ts`

```typescript
validateTeacherAvailability(teacherId: string, date: Date): Observable<AvailabilityCheckResult>

createSlotWithConflictResolution(
  payload: TimetablePayload & { 
    backupTeacherId?: string, 
    mergeWithBatchId?: string 
  }
): Observable<TimetableSlotDto>

getScheduleConflicts(teacherId: string, date: Date): Observable<Conflict[]>
```

### 4.3 Free Demo Service

**Path**: `src/app/services/free-demo.service.ts` (NEW)

```typescript
export class FreeDemoService {
  
  // Classes
  getAllClasses(): Observable<FreeDemoClass[]>
  getClassById(id: string): Observable<FreeDemoClass>
  createClass(payload: CreateFreeDemoClassPayload): Observable<FreeDemoClass>
  updateClass(id: string, payload: Partial<FreeDemoClass>): Observable<FreeDemoClass>
  deleteClass(id: string): Observable<void>
  
  // Schedules
  createSchedule(classId: string, payload: CreateSchedulePayload): Observable<FreeDemoSchedule>
  getSchedules(classId: string, filters?: ScheduleFilter): Observable<FreeDemoSchedule[]>
  updateSchedule(id: string, payload: Partial<FreeDemoSchedule>): Observable<FreeDemoSchedule>
  deleteSchedule(id: string): Observable<void>
  
  // Enrollments
  enrollStudent(classId: string, studentId: string): Observable<FreeDemoEnrollment>
  bulkEnrollStudents(classId: string, studentIds: string[]): Observable<FreeDemoEnrollment[]>
  getEnrollments(classId: string): Observable<FreeDemoEnrollment[]>
  getFreeDemoStudents(filters?: StudentFilter): Observable<User[]>
  markAttendance(scheduleId: string, studentId: string): Observable<void>
}
```

### 4.4 Enhanced Registration Service

**Modify**: `src/app/services/registration.service.ts`

```typescript
registerStudent(data: StudentRegistrationPayload): Observable<User>
// StudentRegistrationPayload includes boardType field

updateBoardPreference(studentId: string, boardType: BoardType): Observable<User>

getCoursesForBoard(boardType: BoardType): Observable<Course[]>

getBatchesForBoard(boardType: BoardType): Observable<Batch[]>
```

---

## Phase 5: Data Flow & Logic

### 5.1 Teacher Unavailability Check Flow

```
Admin creates/edits timetable schedule
↓
System checks: Is this teacher available on this date?
↓
├─ NO UNAVAILABILITY FOUND
│  └─ Allow schedule creation normally
│
└─ UNAVAILABILITY FOUND
   ├─ Show: "Teacher unavailable on this date"
   ├─ Option 1: Select backup teacher
   │  ├─ Get list of available teachers
   │  └─ Assign backup teacher
   ├─ Option 2: Merge with existing batch
   │  ├─ Get list of batches with available teachers
   │  └─ Merge students & use existing batch
   └─ Option 3: Cancel this schedule
```

### 5.2 Class Merge Logic

**When merging two classes**:
```
1. Primary batch (with unavailable teacher)
2. Secondary batch (with available teacher)

Actions:
├─ Move all students from primary → secondary
├─ Update timetable slots (secondary teacher teaches both)
├─ Notify all affected students
├─ Archive/mark primary batch as merged
├─ Store merge reason in audit log
└─ Create merged batch record
```

### 5.3 Student Registration Flow (Board Selection)

```
Student clicks "Register"
↓
Registration modal opens
↓
Step 1: Select Role
├─ Teacher
├─ Student ← selecting this
└─ Parent

Step 2: Student Registration Form (NEW FLOW)
├─ Email
├─ Password
├─ Full Name
├─ Contact
├─ Board Type Selection ← NEW
│  ├─ State Board
│  ├─ CBSE
│  └─ Other
├─ Is Free Demo Student? (CHECKBOX) ← NEW
│  ├─ Yes → Mark as free-demo, show available demos
│  └─ No → Show regular courses
├─ Course Selection (filtered by board)
├─ Batch Selection (filtered by board)
└─ Submit

Backend:
├─ Create user with boardType
├─ Set isFreeDemoStudent = true/false
├─ If free demo → Create enrollment in selected demo class
└─ Return success

Student receives:
├─ Welcome email
├─ Board-specific course content links
├─ Free demo schedule (if applicable)
└─ Login credentials
```

### 5.4 Free Demo Class Creation & Scheduling

```
Admin navigates to: Learning → Free Demo Classes
↓
Clicks "Create New Free Demo Class"
↓
Modal: Free Demo Class Details
├─ Class Name: "Mathematics Fundamentals Demo"
├─ Course: [Select]
├─ Category: Foundation/Standard/Advanced
├─ Maximum Capacity: 50
├─ Start Date: 2025-03-25
├─ End Date: 2025-06-25
├─ Notes: [Optional details]
└─ Create button

After creation, admin can:
├─ Add schedules (click "Add Schedule")
│  ├─ Select Date
│  ├─ Pick Session Time
│  ├─ Assign Teacher
│  ├─ System checks: Is teacher available? ← VALIDATION
│  ├─ Show backup teacher option if unavailable
│  ├─ Enter Topic Name
│  └─ Save schedule
├─ View enrollments
├─ View attendance
└─ Edit/Delete
```

---

## Phase 6: UI/UX Templates

### 6.1 Teacher Availability Calendar

**Features**:
- Monthly calendar view
- Green days = Available
- Red days = Unavailable
- Click to add/remove unavailability
- Reason tooltip on hover
- Backup teacher suggestions

### 6.2 Smart Scheduling Modal

**On teacher unavailability detection**:
```
┌─────────────────────────────────┐
│ SCHEDULING CONFLICT DETECTED    │
├─────────────────────────────────┤
│ Teacher: John Doe               │
│ Date: Monday, March 25, 2025    │
│ Status: UNAVAILABLE             │
│ Reason: Personal Leave          │
├─────────────────────────────────┤
│ RESOLUTION OPTIONS:             │
│                                 │
│ ○ Select Backup Teacher         │
│   [Dropdown: Teacher A, B, C]   │
│                                 │
│ ○ Merge with Existing Class     │
│   [Dropdown: Class X (25 stds)] │
│                                 │
│ ○ Cancel This Schedule          │
│                                 │
│ [Proceed] [Cancel]              │
└─────────────────────────────────┘
```

### 6.3 Board Selection in Registration

```
┌─────────────────────────────────┐
│ STUDENT REGISTRATION            │
├─────────────────────────────────┤
│ Step 2 of 4: Education Board    │
│                                 │
│ ⊙ CBSE                          │
│ ○ State Board                   │
│ ○ Other                         │
│                                 │
│ Selecting your board helps us   │
│ provide curriculum-specific     │
│ content and batches.            │
│                                 │
│ [Next] [Back]                   │
└─────────────────────────────────┘
```

### 6.4 Free Demo Class Planning

**Left Panel: Demo Classes List**
```
┌─────────────────┐
│ Demo Classes    │
├─────────────────┤
│ ✓ Math Basics   │ (Planned)
│   50/50 seats   │
│   Mar-Jun 2025  │
│                 │
│ ✓ Science 101   │ (Active)
│   45/50 seats   │
│   Mar-Jun 2025  │
│                 │
│ ✓ English Prep  │ (Planned)
│   30/40 seats   │
│   Apr-Jul 2025  │
│                 │
│ [+ New Class]   │
└─────────────────┘
```

**Right Panel: Schedule for Selected Class**
```
┌──────────────────────────┐
│ Math Basics - Schedules  │
├──────────────────────────┤
│ Calendar view or List    │
│                          │
│ Date     Time    Teacher │
│ ├─ Mar25 9:30am  John D  │
│ │  [Edit] [Delete]       │
│ ├─ Mar26 2:00pm  Jane S  │
│ │  [Edit] [Delete]       │
│ ├─ Mar27 4:00pm  TBD     │
│ │  [Edit] [Delete]       │
│                          │
│ [+ Add Schedule]         │
└──────────────────────────┘
```

---

## Phase 7: Implementation Sequence

### Sprint 1: Database & Core APIs (2 weeks)
- [ ] Create all database tables and migrations
- [ ] Create backend APIs for teacher availability
- [ ] Create backend APIs for free demo classes & schedules
- [ ] Update student model with board_type

### Sprint 2: Backend Integration & Services (2 weeks)
- [ ] Implement teacher availability check logic
- [ ] Implement conflict resolution & class merge logic
- [ ] Implement free demo enrollment logic
- [ ] Create all required backend services

### Sprint 3: Frontend Services & Registration (2 weeks)
- [ ] Create frontend services (teacher-availability.service, free-demo.service)
- [ ] Enhance registration component with board selection
- [ ] Add board filtering logic
- [ ] Create basic UI for all components

### Sprint 4: Teacher Availability UI (1.5 weeks)
- [ ] Build teacher availability calendar
- [ ] Build smart scheduling modal
- [ ] Integrate availability check to timetable
- [ ] Add backup teacher suggestions UI

### Sprint 5: Free Demo Management UI (1.5 weeks)
- [ ] Build free demo class list component
- [ ] Build create/edit demo class modal
- [ ] Build free demo scheduling calendar
- [ ] Build enrollment management view

### Sprint 6: Testing & Polish (1 week)
- [ ] Unit tests for services
- [ ] Integration tests for critical flows
- [ ] E2E tests for registration, scheduling
- [ ] UI/UX polish and refinements

---

## Phase 8: Key Files to Create/Modify

### New Files to Create
```
src/app/services/teacher-availability.service.ts
src/app/services/free-demo.service.ts
src/app/components/users/teachers/teacher-availability.component.ts
src/app/components/users/teachers/teacher-availability.component.html
src/app/components/users/teachers/teacher-availability.component.css
src/app/components/learning/free-demo/free-demo-management.component.ts
src/app/components/learning/free-demo/free-demo-management.component.html
src/app/components/learning/free-demo/free-demo-management.component.css
src/app/components/learning/free-demo/free-demo-scheduling.component.ts
src/app/components/learning/free-demo/free-demo-scheduling.component.html
src/app/components/learning/free-demo/free-demo-scheduling.component.css
src/app/components/learning/free-demo/free-demo-enrollment.component.ts
src/app/components/learning/free-demo/free-demo-enrollment.component.html
src/app/components/learning/free-demo/free-demo-enrollment.component.css
src/app/models/teacher-availability.model.ts
src/app/models/free-demo.model.ts
src/app/models/free-demo-schedule.model.ts
```

### Files to Modify
```
src/app/components/registration/registration.component.ts
src/app/components/registration/registration.component.html
src/app/components/learning/timetable/timetable.component.ts
src/app/components/learning/timetable/timetable.component.html
src/app/components/learning/batches/batches.component.ts
src/app/services/timetable.service.ts
src/app/app-routing.module.ts (add new routes)
src/app/app.module.ts (import new components)
```

---

## Phase 9: Integration Points

### 9.1 User Role & Permissions
- Admin: Full access to all features (teacher availability, free demo, scheduling)
- Teacher: View own availability, mark unavailable
- Student: View available free demos during registration

### 9.2 Notifications
- Admin notified of teacher unavailability
- Students notified of batch merge (if their batch merged)
- Teachers notified of backup or merge situations
- Free demo students notified of schedule changes

### 9.3 Audit Logging
- Log all teacher unavailability changes
- Log all class merge operations with reasons
- Log all free demo class creations & modifications
- Log student board selection during registration

---

## Phase 10: Error Handling & Edge Cases

### 10.1 Teacher Unavailability
- ✓ No available teachers → Show all options to merge
- ✓ Only 1 teacher available → Auto-recommend
- ✓ Mark teacher unavailable after scheduling → System alert
- ✓ Bulk unavailability (holidays) → Vacation mode

### 10.2 Class Merging
- ✓ Capacity exceeded → Split into multiple classes
- ✓ Batch has no classes yet → Block merge
- ✓ Batch already merged → Don't allow re-merge
- ✓ Different courses → Warn admin before merging

### 10.3 Free Demo Enrollment
- ✓ Class at capacity → Show waitlist option
- ✓ Student already enrolled → Prevent duplicate
- ✓ Free demo over → Can't enroll new students
- ✓ No teacher assigned → Show pending status

### 10.4 Registration Flow
- ✓ No courses for selected board → Guide user
- ✓ Board mismatch with batch → Show warning
- ✓ Free demo full → Show other options
- ✓ Registration duplicate check → Prevent duplicates

---

## Deliverables & Success Metrics

### Success Metrics
- ✓ Teacher unavailability prevented wrong scheduling
- ✓ 100% of conflicting schedules resolved
- ✓ Registration with board selection takes <2 minutes
- ✓ Free demo enrollment >30% of registrations
- ✓ System prevents scheduling errors (0 conflicts)

### Deliverables
1. Complete database schema with migrations
2. All backend APIs (documented with OpenAPI)
3. All frontend components with full functionality
4. All services and models
5. Unit & integration tests (>80% coverage)
6. User documentation & admin guide
7. Demo video showing all features

---

## Technical Considerations

### Performance
- Index teacher_availability by (teacherId, date)
- Cache available teachers for quick lookup
- Pagination on free demo schedules (if large)
- Lazy load demo enrollments

### Security
- Only admins can create/modify teacher availability
- Only students can register as free demo
- Teachers can only modify their own availability
- Free demo classes require auth check

### Scalability
- Use database views for complex queries
- Implement query pagination
- Cache frequently accessed data (board types, categories)
- Use async operations for bulk operations

---

## Optional Enhancements (Future Phases)

1. **Automation**: Auto-send invites to free demo students for scheduled classes
2. **Analytics**: Dashboard showing demo conversion rates
3. **Feedback**: Student feedback form after demo class
4. **Promotions**: Discount codes for demo students to upgrade
5. **Calendar Sync**: Sync scheduled classes to Google/Outlook calendar
6. **Bulk Upload**: Bulk upload teacher unavailability (.csv)
7. **Mobile App**: Mobile app for students to register for demo
8. **Video Archive**: Record and store all demo classes for later viewing
