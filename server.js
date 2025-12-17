const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// IMPORTANT: Serve your HTML files for the Cloud
app.use(express.static(__dirname)); 
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// 1. Database Connection (Cloud Compatible)
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'NewStrong@123',
    database: process.env.DB_NAME || 'library_db',
    port: process.env.DB_PORT || 3306
});

db.connect(err => {
    if (err) { console.error('DB Connection Failed:', err); }
    else { console.log('Connected to Database'); }
});

// 2. Login API
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.query(sql, [username, password], (err, result) => {
        if (err) return res.json({ error: err });
        if (result.length > 0) {
            return res.json({ success: true, role: result[0].role });
        } else {
            return res.json({ success: false, message: "Invalid Credentials" });
        }
    });
});

// 3. Books API (Master List)
app.get('/books', (req, res) => {
    db.query("SELECT * FROM books", (err, result) => {
        if (err) return res.json(err);
        return res.json(result);
    });
});

// 4. Add Book API
app.post('/add-book', (req, res) => {
    const { title, author, category, stock } = req.body;
    const sql = "INSERT INTO books (title, author, category, total_stock, available_stock) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [title, author, category, stock, stock], (err, result) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, message: "Book added successfully" });
    });
});

// 5. Issue Book API
app.post('/issue-book', (req, res) => {
    const { bookId, memberName, dueDate } = req.body;
    
    const checkStockSql = "SELECT available_stock FROM books WHERE id = ?";
    db.query(checkStockSql, [bookId], (err, result) => {
        if (err) return res.json({ success: false, error: err });
        if (result.length === 0) return res.json({ success: false, message: "Book not found" });
        if (result[0].available_stock <= 0) return res.json({ success: false, message: "Book not available" });
        
        const insertTxSql = "INSERT INTO transactions (book_id, user_name, due_date) VALUES (?, ?, ?)";
        db.query(insertTxSql, [bookId, memberName, dueDate], (err, result) => {
            if (err) return res.json({ success: false, error: err });
            
            const updateStockSql = "UPDATE books SET available_stock = available_stock - 1 WHERE id = ?";
            db.query(updateStockSql, [bookId], (err, result) => {
                if (err) return res.json({ success: false, error: err });
                return res.json({ success: true, message: "Book issued successfully" });
            });
        });
    });
});

// 6. Return Book API (With Fine Logic)
app.post('/return-book', (req, res) => {
    const { bookId, memberName } = req.body;

    const findTxSql = "SELECT * FROM transactions WHERE book_id = ? AND user_name = ? AND return_date IS NULL";
    db.query(findTxSql, [bookId, memberName], (err, results) => {
        if (err) return res.json({ success: false, error: err });
        if (results.length === 0) {
            return res.json({ success: false, message: "No active record found. Is the Book ID correct?" });
        }

        const transaction = results[0];
        const dueDate = new Date(transaction.due_date);
        const today = new Date();
        
        let fine = 0;
        const diffTime = today - dueDate; 
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays > 0) {
            fine = diffDays * 5; // $5 per day penalty
        }

        const updateTxSql = "UPDATE transactions SET return_date = CURDATE(), fine_amount = ? WHERE id = ?";
        db.query(updateTxSql, [fine, transaction.id], (err, result) => {
            if (err) return res.json({ success: false, error: err });

            const updateStockSql = "UPDATE books SET available_stock = available_stock + 1 WHERE id = ?";
            db.query(updateStockSql, [bookId], (err, result) => {
                if (err) return res.json({ success: false, error: err });
                res.json({ success: true, message: "Book Returned Successfully", fineAmount: fine });
            });
        });
    });
});

// 7. Update Book API
app.put('/update-book', (req, res) => {
    const { id, title, author, category, stock } = req.body;
    const sql = "UPDATE books SET title = ?, author = ?, category = ?, available_stock = ? WHERE id = ?";

    db.query(sql, [title, author, category, stock, id], (err, result) => {
        if (err) return res.json({ success: false, error: err });
        if (result.affectedRows === 0) return res.json({ success: false, message: "Book ID not found" });
        return res.json({ success: true, message: "Book updated successfully" });
    });
});

// 8. Add Member API
app.post('/add-member', (req, res) => {
    const { name, email, phone } = req.body;
    const sql = "INSERT INTO members (name, email, phone) VALUES (?, ?, ?)";
    
    db.query(sql, [name, email, phone], (err, result) => {
        if (err) {
            if(err.code === 'ER_DUP_ENTRY') return res.json({ success: false, message: "Email already exists!" });
            return res.json({ success: false, error: err });
        }
        return res.json({ success: true, message: "Member added successfully" });
    });
});

// 9. Get All Members API
app.get('/members', (req, res) => {
    db.query("SELECT * FROM members", (err, result) => {
        if (err) return res.json(err);
        return res.json(result);
    });
});

// 10. Check Availability API
app.post('/check-availability', (req, res) => {
    const { bookId } = req.body;
    const sql = "SELECT title, available_stock, total_stock FROM books WHERE id = ?";
    db.query(sql, [bookId], (err, result) => {
        if (err) return res.json({ success: false, error: err });
        if (result.length > 0) {
            return res.json({ success: true, book: result[0] });
        } else {
            return res.json({ success: false, message: "Book ID not found" });
        }
    });
});

// 11. Get Active Issues API (Includes Book ID now)
app.get('/active-issues', (req, res) => {
    const sql = `
        SELECT t.id, t.user_name, t.book_id, b.title, t.due_date 
        FROM transactions t 
        JOIN books b ON t.book_id = b.id 
        WHERE t.return_date IS NULL
    `;
    db.query(sql, (err, result) => {
        if (err) return res.json(err);
        return res.json(result);
    });
});

// 12. Get Overdue Returns API
app.get('/overdue-returns', (req, res) => {
    const sql = `
        SELECT t.id, t.user_name, b.title, t.due_date 
        FROM transactions t 
        JOIN books b ON t.book_id = b.id 
        WHERE t.return_date IS NULL AND t.due_date < CURDATE()
    `;
    db.query(sql, (err, result) => {
        if (err) return res.json(err);
        return res.json(result);
    });
});

// 13. Get All Users API
app.get('/users', (req, res) => {
    db.query("SELECT id, username, role FROM users", (err, result) => {
        if (err) return res.json(err);
        return res.json(result);
    });
});

// 14. Add User API
app.post('/add-user', (req, res) => {
    const { username, password, role } = req.body;
    const sql = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
    db.query(sql, [username, password, role], (err, result) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, message: "User created successfully" });
    });
});

// 15. Delete User API
app.post('/delete-user', (req, res) => {
    const { id } = req.body;
    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({ success: true, message: "User deleted successfully" });
    });
});

// 🚀 CRITICAL FIX: Use Cloud Port (process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});