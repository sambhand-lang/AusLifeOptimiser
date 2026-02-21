const {query} = require('./dist/db');
query('SELECT * FROM property_data WHERE postcode = "2150"')
.then(r => console.log(r.rows))
.catch(console.error);