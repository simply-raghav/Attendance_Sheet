let mysql = require('mysql');

const config = {
    host: 'localhost',
    user: 'root',
    password: "",
    database: 'id20448373_attendance' // change database name
}
 
let connection = mysql.createConnection(config);
 
connection.connect((err) => {
    if (err) {
        console.log('error connecting:' + err.stack);
    } else {
        console.log('connected successfully to DB.');
    }
});
 
module.exports = {
    connection: mysql.createConnection(config)
} 