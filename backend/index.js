const express = require('express');
const cors = require('cors');
const app = express()
const config = require('../backend/conn')

// import validators
const { body, validationResult } = require('express-validator');

app.use(cors())
const port = 5000;
bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const connection = config.connection

// api for login of teacher
app.post("/login-teacher",
    // body(fieldname, errorMsg)
    [
        body("email", "Enter valid email").isEmail(),
        body("password", "password min length 5").isLength({ min: 5 })
    ],
    async (req, res) => {

        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body

        let sql = `select teacher_id from teacher_tb where email_id='${email}' and password='${password}'`

        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send(err)
            }
            if (result.length > 0) {
                res.send({ success: true, msg: "teacher login successful", result })
            }

            if (result) {
                res.send({ msg: "no teacher found" })
            }
        })
    })


// api for login of student
app.post("/login-student",
    // body(fieldname, errorMsg)
    [body("email", "Enter valid email").isEmail(),
    body("password", "password min length 5").isLength({ min: 5 })],
    async (req, res) => {

        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body

        let sql = `select student_id from student_tb where email_id='${email}' and password='${password}'`


        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send(err)
            }
            if (result.length > 0) {
                res.send({ success: true, msg: "student login successful", result })
            }

            if (result) {
                res.send({ msg: "no student found" })
            }
        })
    })


// adding subjects to subject table
app.post("/add-subject",
    // body(fieldname, errorMsg)
    [body("subject_code", "Enter subject code of length 7").isLength({ min: 7, max: 7 }),
    body("subject_name", "password min length 5").isLength({ min: 4 }),
    ],
    async (req, res) => {

        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { subject_code, subject_name } = req.body

        const sql = `insert into subject_TB(subject_code, subject_name) values('${subject_code}', '${subject_name}')`
        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send(err)
            }

            if (result) {
                res.send({ success: true, msg: "subject added successfully" })
            }
        })
    })


// all the subjects taken by a teacher
app.get("/teacher",
    // body(fieldname, errorMsg)
    [
        body("teacher_id", "teacher ID is number").isNumeric(),
    ],
    async (req, res) => {

        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { teacher_id } = req.body

        const sql = `select subject_name, subject_code from subject_tb where subject_code in(select subject_code from teacher_subjects_tb where teacher_ID=${teacher_id});`
        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send(err)
            }

            if (result) {
                res.send({ success: true, result })
            }
        })
    })


// all the subjects taken by a student
app.get("/student",
    // body(fieldname, errorMsg)
    [
        body("student_id", "student ID is number").isNumeric(),
    ],
    async (req, res) => {

        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { student_id } = req.body

        let sql = `select course, semester from student_tb where student_id=${student_id}`
        let course, semester
        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send(err)
                return
            }

            if (result) {
                course = result[0].course
                semester = result[0].semester
            } else {
                res.send({ msg: "no students found" })
            }

            sql = `select subject_name from subject_tb where subject_code in(select subject_code from student_subjects_tb where course='${course}' and semester=${semester})`
            connection.query(sql, (err, result) => {
                if (err) {
                    console.log(err.sqlMessage)
                    res.send(err)
                }

                if (result) {
                    res.send(result)
                } else {
                    res.send({ msg: "no subjects found" })
                }
            })
        })
    })



// all the students of particular course and semester
app.get("/students",
    // body(fieldname, errorMsg)
    [
        body("course", "enter valid course name").isLength({ min: 3 }),
        body("semester", "enter semester value").isNumeric(),
    ],
    async (req, res) => {

        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { course, semester } = req.body

        let sql = `select * from student_tb where course='${course}' and semester=${semester}`
        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send(err)
                return
            }

            if (result) {
                res.send(result)
            }
        })
    })





// adding teacher to subject table
app.post("/add-teacher", async (req, res) => {
    const { teacher_id, teacher_name, email } = req.body

    const sql = `insert into teacher_TB(teacher_name, email) values('${teacher_name}', '${email}')`
    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err.sqlMessage)
            res.send(err)
        } else {
            res.send(result)
        }
    })
})


// api for sign up of user
app.post("/student-reg", async (req, res) => {
    const { name, email, reg_no, course, department, semester } = req.body

    let sql = `select * from student_TB where email=${email}`

    // check if user is already registered or not
    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err.sqlMessage)
        } else {
            console.log("Email already registered")
            res.send(result)
            return
        }
    })


    sql = `insert into student_TB(name, email, reg_no, course, department, semester) values ('${name}', '${email}', '${reg_no}', '${course}', '${department}', '${semester}')`
    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err.sqlMessage)
            res.send(err)
        } else {
            res.send(result)
        }
    })
})


// console.log('todo list RESTful API server started on: ' + port);

app.listen(port);