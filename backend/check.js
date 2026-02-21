const {query} = require('./dist/db');
query('SELECT * FROM property_data WHERE UPPER(suburb_name) = UPPER("BONDI")')
.then(r => console.log(r.rows))
.catch(console.error);