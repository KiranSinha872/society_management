# Apartment & Society Complaint Management System

A full-stack web application for managing Apartment / Housing Society complaints, maintenance staff dispatch, and resident directories, built with **Node.js, Express.js, MongoDB (Mongoose), and EJS**.

---

## 👥 Three Distinct User Roles

### 1. 👤 Residents (Public / Default Access)
- **Submit Maintenance Issues**: Category, flat number, block/wing (A–E), area/location, priority level, optional photo URL, and description.
- **Track Status**: Monitor ticket status in real-time (`Pending`, `Assigned`, `In Progress`, `Resolved`) and read technician resolution notes.

---

### 2. 🛡️ Admin / Society Management
- **Admin Login**:
  - **Email**: `sinhakiran872@gmail.com`
  - **Password**: `Kiran@2006`
  - **Login Page**: [http://localhost:3007/login](http://localhost:3007/login)
- **Exclusive Permissions**:
  - **Onboard Maintenance Staff**: Only the Admin can register new staff members and grant them portal login credentials.
  - **Assign Technicians**: Dispatch tickets to active staff with category/specialty matching.
  - **Manage Directory**: Add, edit, and delete resident profiles and staff accounts.
  - **Delete Complaints**: Remove invalid ticket entries.
  - **Society Analytics**: Real-time KPI breakdown across categories and blocks.

---

### 3. 👷 Maintenance Staff (Admin-Registered Staff Only)
- **Staff Authentication**:
  - Only emails **registered by the Admin** in the Staff Directory can log in.
  - Default password set by admin upon creation (e.g., `Staff@123` or custom).
- **Staff Portal & Work Desk** (`/staff/portal`):
  - View all tickets specifically assigned to them.
  - Update personal availability status (`🟢 Available`, `🔵 On Duty`, `🔴 On Leave`).
  - Update task progress (`In Progress` ➔ `Resolved`).
  - Log technician resolution notes and replaced parts.

---

## 📁 Project Structure

```
ComplaintManagementSystem/
├── config/
│   └── db.js                 # MongoDB connection using Mongoose
├── controllers/
│   ├── authController.js      # Unified Admin & Staff authentication
│   ├── complaintController.js # Complaint handlers & analytics logic
│   ├── residentController.js  # Resident directory handlers
│   └── staffController.js     # Staff directory & dedicated staff portal handlers
├── middlewares/
│   └── auth.js                # isAdmin, isStaff & isStaffOrAdmin route guards
├── models/
│   ├── complaintmodel.js      # Complaint schema & timeline history
│   ├── residentmodel.js       # Resident schema
│   └── staffmodel.js          # Maintenance staff schema with login password
├── routes/
│   ├── authroutes.js          # Login & Logout routes
│   ├── complaintroutes.js     # Express routes for complaints & dashboard
│   ├── residentroutes.js      # Express routes for residents
│   └── staffroutes.js         # Express routes for staff & staff workspace
├── views/
│   ├── login.ejs              # Unified portal login page (Admin & Staff)
│   ├── home.ejs              # Dashboard with role-aware header & analytics
│   ├── staffportal.ejs       # Dedicated maintenance staff workspace
│   ├── complaints.ejs        # Complaints list with filters, image preview & workflow
│   ├── complaintform.ejs     # Register complaint form with image URL & staff select
│   ├── complaintedit.ejs     # Edit complaint, update status & view timeline
│   ├── residents.ejs         # Residents directory list with filters
│   ├── residentform.ejs      # Add resident form (Admin only)
│   ├── residentedit.ejs      # Edit resident details (Admin only)
│   ├── staff.ejs             # Maintenance staff directory
│   ├── staffform.ejs         # Add staff member form (Admin only)
│   └── staffedit.ejs         # Edit staff details form (Admin only)
├── .env.example              # Environment variables template
├── .env                      # Local environment configuration
├── .gitignore                # Git ignore rules
├── app.js                    # Express application entry point
├── package.json              # Dependencies and scripts
├── vercel.json               # Serverless deployment configuration
└── README.md                 # Complete documentation
```

---

## 🛠️ Prerequisites & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables** in `.env`:
   ```env
   PORT=3007
   MONGO_URL=mongodb://localhost:27017/society_complaint_db
   SESSION_SECRET=society_secret_key_2026
   ADMIN_EMAIL=sinhakiran872@gmail.com
   ADMIN_PASSWORD=Kiran@2006
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. Open **[http://localhost:3007](http://localhost:3007)** in your browser.

---

## 📄 License

ISC
