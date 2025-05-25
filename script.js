const API = '/api';
const token = localStorage.getItem('token');

function createNews() {
  	const title = document.getElementById('title').value;
  	const content = document.getElementById('content').value;
  	const image = document.getElementById('image').files[0];

  	const formData = new FormData();
  	formData.append('title', title);
  	formData.append('content', content);
  	if (image) formData.append('image', image);

  	fetch(`${API}/news`, {
    	method: 'POST',
    	headers: {
      		Authorization: `Bearer ${token}`
    	},
    	body: formData
  	})
    	.then(res => res.json())
    	.then(data => {
      		alert(data.message);
      		window.location.href = 'news.html';
    	});
}

function loadSingleNews() {
  	const params = new URLSearchParams(location.search);
  	const id = params.get('id');

  	fetch(`${API}/news`)
    	.then(res => res.json())
    	.then(newsList => {
      		const news = newsList.find(n => n.id == id);
      	if (!news) {
        	document.body.innerHTML = '<p>Новину не знайдено</p>';
        	return;
      	}
      	document.getElementById('newsTitle').textContent = news.title;
      	document.getElementById('newsContent').textContent = news.content;
      	document.getElementById('newsMeta').textContent = `Автор: ${news.author}, дата: ${news.created_at}`;

      	if (news.image_url) {
        	const img = document.getElementById('newsImage');
        	img.src = news.image_url;
        	img.style.display = 'block';
      	}
    });
}

function loadNews() {
  	const author = document.getElementById('authorFilter')?.value;
  	const date = document.getElementById('dateFilter')?.value;

  	const params = new URLSearchParams();
  	if (author) params.append('author', author);
  	if (date) params.append('date', date);

  	fetch(`${API}/news?${params.toString()}`)
    	.then(res => res.json())
    	.then(news => {
      		const list = document.getElementById('newsList');
      		list.innerHTML = '';
      		news.forEach(item => {
        		const div = document.createElement('div');
        		div.innerHTML = `
          		<h3><a href="news-detail.html?id=${item.id}" target="_blank">${item.title}</a></h3>
          		<p>${item.content}</p>
          		<small>Автор: ${item.author}, дата: ${item.created_at}</small><br>
        		`;
        		list.appendChild(div);
      		});
    	});
}

function logout() {
  	localStorage.removeItem('token');
  	window.location.href = 'index.html';
}

function register() {
  	const username = document.getElementById('username').value;
  	const password = document.getElementById('password').value;
  	fetch(`${API}/register`, {
    	method: 'POST',
    	headers: { 'Content-Type': 'application/json' },
    	body: JSON.stringify({ username, password })
  	})
    	.then(res => res.json())
    	.then(data => alert(data.message));
}

function login() {
  	const username = document.getElementById('username').value;
  	const password = document.getElementById('password').value;
  	fetch(`${API}/login`, {
    	method: 'POST',
    	headers: { 'Content-Type': 'application/json' },
    	body: JSON.stringify({ username, password })
  	})
    	.then(res => res.json())
    	.then(data => {
      	if (data.token) {
        	localStorage.setItem('token', data.token);
        	window.location.href = 'news.html';
      	} else {
        	alert(data.message);
      	}
    });
}

function resetFilters() {
  	document.getElementById('authorFilter').value = '';
  	document.getElementById('dateFilter').value = '';
  	loadNews();
}

if (document.getElementById('newsList')) loadNews();
if (document.getElementById('newsTitle')) loadSingleNews();
