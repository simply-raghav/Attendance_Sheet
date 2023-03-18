const express = require('express')
const cors = require('cors')
const app = express()
const config = require('./conn')

app.use(cors())
const port = 5000;
bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const connection = config.connection

// Use this middleware as we are sending data in json format to the server
app.use(express.json());

app.use('/', require('./routes/admin'));
app.use('/', require('./routes/attendence'));
app.use('/', require('./routes/student'));
app.use('/', require('./routes/teacher'));

app.listen(port, () => {
    console.log("This is port http://localhost:" + port);
});


