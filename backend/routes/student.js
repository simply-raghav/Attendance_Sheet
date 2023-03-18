const express = require('express');
const router = express.Router();


// database connection
const config = require('../conn')
const connection = config.connection


// bcryptjs package for password hashing and encryption
const bcrypt = require('bcryptjs');

// import validators
const { body, validationResult } = require('express-validator');

// JSON Web Token to generate unique Token for user
const jwt = require('jsonwebtoken');
// Signature Key
const AUTH_KEY = "MYNameISRahul@6820";



// api for login of student
router.post("/login-student",
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

        let sql = `select * from student_tb where email_id='${email}' and password='${password}'`

        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }
            if (result.length > 0) {
                res.send({ success: true, msg: "student login successful", result })
                return
            }

            if (result) {
                res.send({ msg: "no student found" })
                return
            }
        })
    })



// all the subjects taken by a student
router.get("/student-subjects",
    // body(fieldname, errorMsg)
    [
        body("student_id", "student ID is number").isNumeric(),
    ],
    async (req, res) => {

        // check for errors in input
        const errors = validationResult(req.query);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { student_id } = req.query

        let sql = `select course, semester from student_tb where student_id=${student_id}`
        let course, semester
        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }

            if (result) {
                course = result[0].course
                semester = result[0].semester
            } else {
                res.send({ msg: "no students found" })
                return
            }

            sql = `select subject_name, subject_code from subject_tb where subject_code in(select subject_code from student_subjects_tb where course='${course}' and semester=${semester})`
            connection.query(sql, (err, result) => {
                if (err) {
                    console.log(err.sqlMessage)
                    res.send({ success: false, err })
                    return
                }

                if (result) {
                    res.send({ success: true, result })
                } else {
                    res.send({ msg: "no subjects found" })
                }
            })
        })
    })



// all the students of particular course and semester
router.get("/students",
    // body(fieldname, errorMsg)
    [
        body("course", "enter valid course name").isLength({ min: 3 }),
        body("semester", "enter semester value").isNumeric(),
    ],
    async (req, res) => {
        // check for errors in input
        const errors = validationResult(req.query);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { course, semester } = req.query

        let sql = `select student_id, student_regno, student_name, email_id, course, department, semester from student_tb where course='${course}' and semester=${semester}`
        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }

            if (result) {
                res.send({ success: true, result })
                return
            }
        })
    })



// Export the module
module.exports = router;