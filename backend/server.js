const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let comments = [
    { id: 1, text: "Chào mừng bạn đến với hệ thống Lab XSS!" }
];

// 1. Reflected XSS
app.get('/api/search', (req, res) => {
    const query = req.query.q || '';
    res.json({ result: `Kết quả tìm kiếm cho: <b>${query}</b>` });
});

// 2. Stored XSS
app.get('/api/comments', (req, res) => {
    res.json(comments);
});

app.post('/api/comments', (req, res) => {
    const { text } = req.body;
    comments.push({ id: Date.now(), text: text });
    res.json({ success: true });
});

app.listen(3001, () => {
    console.log('Backend đang chạy tại http://localhost:3001');
});