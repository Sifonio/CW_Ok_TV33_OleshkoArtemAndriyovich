import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const SECRET = 'secret123';

app.use(cors({
  	origin: '*',
  	methods: ['GET', 'POST', 'PUT', 'DELETE'],
  	allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const storage = multer.diskStorage({
  	destination: (req, file, cb) => {
    	cb(null, path.join(__dirname, 'public/uploads'));
  	},
  	filename: (req, file, cb) => {
    	const unique = Date.now() + '-' + file.originalname;
    	cb(null, unique);
  	}
});
const upload = multer({ storage });

function verifyToken(req, res, next) {
  	const auth = req.headers.authorization;
  	if (!auth || !auth.startsWith('Bearer ')) {
    	return res.status(401).json({ message: 'Немає або невірний токен' });
  	}
  	try {
    	const token = auth.split(' ')[1];
    	const decoded = jwt.verify(token, SECRET);
    	req.user = decoded;
    	next();
  	} catch {
    	res.status(401).json({ message: 'Невірний токен' });
  }
}

app.post('/api/register', async (req, res) => {
  	const { username, password } = req.body;
  	if (!username || !password) return res.status(400).json({ message: 'Обовʼязкові поля' });

  	const hash = await bcrypt.hash(password, 10);
  	db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {
    	if (err) return res.status(500).json({ message: 'Помилка реєстрації' });
    	res.json({ message: 'Реєстрація успішна' });
  	});
});

app.post('/api/login', (req, res) => {
  	const { username, password } = req.body;
  	db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    	if (err || results.length === 0) return res.status(401).json({ message: 'Невірні дані' });

    	const match = await bcrypt.compare(password, results[0].password);
    	if (!match) return res.status(401).json({ message: 'Невірні дані' });

    	const token = jwt.sign({ id: results[0].id }, SECRET);
    	res.json({ token });
  	});
});

app.get('/api/news', (req, res) => {
  	const { author, date } = req.query;

  	let query = `
    	SELECT news.id, title, content, image_url, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at, users.username AS author
    	FROM news
    	JOIN users ON news.user_id = users.id
  	`;

  	const filters = [];
  	const params = [];

  	if (author) {
    	filters.push('users.username = ?');
    	params.push(author);
  	}

  	if (date) {
    	filters.push('DATE(news.created_at) = ?');
    	params.push(date);
  	}

  	if (filters.length) {
    	query += ' WHERE ' + filters.join(' AND ');
  	}

  	query += ' ORDER BY news.created_at DESC';

  	db.query(query, params, (err, results) => {
    	if (err) return res.status(500).json({ message: 'Помилка при отриманні новин' });
    	res.json(results);
  	});
});

app.get('/api/news/:id', (req, res) => {
  	const id = req.params.id;
  	const query = `
    	SELECT news.id, title, content, image_url, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at, users.username AS author
    	FROM news
    	JOIN users ON news.user_id = users.id
    	WHERE news.id = ?
  	`;

  	db.query(query, [id], (err, results) => {
    	if (err) return res.status(500).json({ message: 'Помилка при завантаженні новини' });
    	if (results.length === 0) return res.status(404).json({ message: 'Новину не знайдено' });
    	res.json(results[0]);
  	});
});

app.post('/api/news', verifyToken, upload.single('image'), (req, res) => {
  	const { title, content } = req.body;
  	const userId = req.user.id;

  	if (!title || !content) {
    	return res.status(400).json({ message: 'Заголовок і зміст обовʼязкові' });
  	}

  	let imageUrl = null;
  	if (req.file) {
    	imageUrl = `/uploads/${req.file.filename}`;
  	}

  	db.query(
    	'INSERT INTO news (user_id, title, content, image_url) VALUES (?, ?, ?, ?)',
    	[userId, title, content, imageUrl],
    	(err) => {
      		if (err) return res.status(500).json({ message: 'Помилка при створенні новини' });
      		res.json({ message: 'Новину додано' });
    	}
  	);
});

app.delete('/api/news/:id', verifyToken, (req, res) => {
  	const newsId = req.params.id;
  	const userId = req.user.id;

  	db.query('DELETE FROM news WHERE id = ? AND user_id = ?', [newsId, userId], (err, result) => {
    	if (err) return res.status(500).json({ message: 'Помилка' });
    	if (result.affectedRows === 0) return res.status(403).json({ message: 'Заборонено' });
    	res.json({ message: 'Видалено' });
  	});
});

app.put('/api/news/:id', verifyToken, (req, res) => {
  	const { title, content } = req.body;
  	const newsId = req.params.id;
  	const userId = req.user.id;

  	db.query('UPDATE news SET title = ?, content = ? WHERE id = ? AND user_id = ?', [title, content, newsId, userId], (err, result) => {
    	if (err) return res.status(500).json({ message: 'Помилка' });
    	if (result.affectedRows === 0) return res.status(403).json({ message: 'Заборонено' });
    	res.json({ message: 'Оновлено' });
  	});
});

app.listen(3000, () => console.log('Сервер на http://localhost:3000'));
