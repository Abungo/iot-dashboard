const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 80;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the public directory

// Middleware for session management
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});
// Serve login.html from the public directory
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve register.html from the public directory
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// User login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsersFromJSON();

    const user = users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.username = username;
        res.redirect('/welcome');
    } else {
        res.status(401).send('Invalid username or password');
    }
});

// User registration endpoint
app.post('/register', (req, res) => {
    const { username, password, first, last, designation } = req.body;
    const users = readUsersFromJSON();

    // Check if username already exists
    if (users.some(user => user.username === username)) {
        return res.status(400).send('Username already exists');
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Add the new user to the users array
    users.push({ username, password: hashedPassword, first, last, designation });

    // Write updated users array to JSON file
    writeUsersToJSON(users);

    res.send('Registration successful');
});

// Route for rendering welcome page
app.get('/welcome', isAuthenticated, (req, res) => {
    res.render('welcome', { username: req.session.username });
});

// Route for handling logout
app.post('/logout', isAuthenticated, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/welcome');
        }
        res.redirect('/login');
    });
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.username) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Function to read users from JSON file
function readUsersFromJSON() {
    try {
        const fileContent = fs.readFileSync('users.json');
        return JSON.parse(fileContent);
    } catch (err) {
        return [];
    }
}

// Function to write users to JSON file
function writeUsersToJSON(users) {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
