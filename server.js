const express = require('express');
const app = express();
const port = 8081;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('register'));

const POSTS_FILE = 'posts.json';
let posts = [];

// Load posts from file
const data = fs.existsSync(POSTS_FILE) ? fs.readFileSync(POSTS_FILE, 'utf8') : '[]';
posts = JSON.parse(data);

function savePostsToFile() {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/posts', (req, res) => {

    res.json(posts);
});


app.post('/api/posts', upload.single('image'), (req, res) => {
    const { content } = req.body;
    console.log("req.body",req.body)
    console.log("req.file",req.file)
    const email = req.body.email;

    const newPost = {
        id: posts.length + 1,
        content,
        email,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
        likes: 0,
        comments: [],
        likedBy: []
    };
    posts.unshift(newPost); 
    savePostsToFile();
    res.status(201).json(newPost);
});

app.post('/api/posts/:id/like', (req, res) => {
    const postId = parseInt(req.params.id);
    const email = req.body.email;
    let post = null;
    for (const p of posts) {
        if (p.id === postId) {
            post = p;
            break;
        }
    }

    if (post) {
        if (post.likedBy.includes(email)) {
            // User has already liked the post, so unlike it
            post.likes -= 1;
            post.likedBy = post.likedBy.filter(e => e !== email);
        } else {
            // User hasn't liked the post yet, so like it
            post.likes += 1;
            post.likedBy.push(email);
        }
        savePostsToFile();
        res.json(post);
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
});

app.post('/api/posts/:id/comment', (req, res) => {
    const postId = parseInt(req.params.id);
    const { commentContent } = req.body;
    let post = null;
    for (const p of posts) {
        if (p.id === postId) {
            post = p;
            break;
        }
    }
    if (post) {
        const newComment = {
            id: post.comments.length + 1,
            content: commentContent,
        };
        post.comments.push(newComment);
        savePostsToFile();
        res.status(201).json(newComment);
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
});

app.delete('/api/posts/:id', (req, res) => {
    const postId = parseInt(req.params.id);
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex > -1) {
        posts.splice(postIndex, 1);
        savePostsToFile();
        res.status(200).json({ message: 'Post deleted' });
    } else {
        res.status(404).json({ message: 'Post not found' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
