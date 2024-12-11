let mysql = require('mysql2');

let connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'immersivedinner'
});

connection.connect(function(err) {
  if (err) {
    console.error('Error connecting to the database: ', err.message);
    return;
  }

  console.log('Connected to the MySQL server.');
});
