#  Library Management System (Full Stack)

A complete Library Management System built with **Node.js**, **Express**, and **MySQL**, featuring a frontend interface for managing books, members, and transactions. This project is deployed using **Render** (Backend/Frontend) and **Aiven** (Cloud Database).

##  Live Demo :
*https://library-management-full-stack-9s36.onrender.com*


(use user id : admin , password : admin123 to log in this system for admin view & userid: staff, password:staff123 for user view )

---


##  Tech Stack
* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Backend:** Node.js, Express.js
* **Database:** MySQL (Hosted on Aiven Cloud)
* **Deployment:** Render (Web Service)

---

##  Features :-
* **Admin Authentication:** Secure login for librarians.
* **Book Management:** Add, Update, and View books (Stock tracking included).
* **Membership Management:** Add and view library members.
* **Transactions:** Issue books and Return books.
* **Fine Calculation:** Auto-calculates fines ($5/day) for late returns.
* **Availability Check:** Real-time stock checking.
* User Management & Role-Based Access Control (RBAC)

This system implements a strict **RBAC** model to ensure security and proper data handling. Access to sensitive administrative features is restricted based on the user's role stored in the database.

###  Roles & Permissions

| Role | Access Level | Description |
| :--- | :--- | :--- |
| **Admin** | **Full Access** | Can manage books, register members, issue/return books, and view all transaction history. |
| **User/Member**| **Restricted** |  View book catalog, check  borrowing history, and chech book availability etc . |

---

##  Deployment Guide (The "Aiven + Render" Method)

This project is deployed using a cloud database and a cloud server. Follow these steps to replicate the deployment.

### Phase 1: Cloud Database Setup (Aiven)
1.  Create a free account at **[Aiven.io](https://aiven.io/)**.
2.  Create a new **MySQL** service (Select the **Free Plan**).
3.  Copy the **Connection Information**:
    * Host, Port, User, Password.
4.  Connect to the cloud database using **MySQL Workbench**.
5.  Run the initialization SQL script to create tables (`users`, `books`, `members`, `transactions`).
6.  **Important:** Insert the admin user:
    ```sql
    INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin');
    ```

### Phase 2: Code Preparation
1.  **Backend (`server.js`):** Ensure the database connection uses environment variables:
    ```javascript
    const db = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });
    ```
    And the server listens on the cloud port:
    ```javascript
    app.listen(process.env.PORT || 3000);
    ```

2.  **Frontend (`.html` files):**
    * Remove all hardcoded `http://localhost:3000` links.
    * Use relative paths (e.g., `fetch('/login')` instead of `fetch('http://localhost...')`).

### Phase 3: Deploy to Render
1.  Push your code to **GitHub**.
2.  Log in to **[Render.com](https://render.com/)**.
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Build Settings:**
    * **Runtime:** Node
    * **Build Command:** `npm install`
    * **Start Command:** `node server.js`
6.  **Environment Variables (Secrets):**
    Add the following variables using your Aiven credentials:

| Key | Value (Example) |
| :--- | :--- |
| `DB_HOST` | `mysql-xyz.aivencloud.com` |
| `DB_PORT` | `12345` |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | `your-secure-password` |
| `DB_NAME` | `library_db` |

7.  Click **Deploy Web Service**.

---

##  Default Credentials
Use these credentials to log in to the dashboard:
* **Username:** `admin`
* **Password:** `admin123`

---

##  Project Structure

            ├── index.html # Login Page 
            ├── dashboard.html # Main Application Dashboard 
            ├── server.js # Backend Logic & API Routes 
            ├── package.json # Dependencies (mysql2, express, cors, etc.) 
            └── README.md # Documentation
            
##  Troubleshooting
* **"Server Error" / Connection Refused:** Check if your HTML files still have `localhost` in the fetch URLs.
* **Database Connection Failed:** Check the **Render Logs**. Verify that the Aiven Password and Host in the Environment Variables are correct.
* **Table Not Found:** Ensure you ran the `CREATE TABLE` SQL commands inside the `library_db` on Aiven.
