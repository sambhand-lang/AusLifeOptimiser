const {query} = require('./dist/db');
query('SELECT * FROM suburbs WHERE postcode = "2026"')
.then(r => console.log(r.rows))
.catch(console.error);