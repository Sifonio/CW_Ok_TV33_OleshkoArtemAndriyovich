import mysql from 'mysql2';

const connection = mysql.createConnection({
    host: '127.0.0.1',
  	user: 'root',     
  	password: '04052006a',     
  	database: 'news_db'
});
connection.connect((err) => {
  	if (err) throw err;
  	console.log('Підключено до бази даних');
});

export default connection;
