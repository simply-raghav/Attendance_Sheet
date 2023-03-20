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
const fetchuser = require('../middleware/fetchuser');
// Signature Key
const AUTH_KEY = "MYNameISRahul@6820";


// api for getting the attendence details of student in particular subject
// query: { subject_code }
// header: { authToken }
router.get("/student-attendance-subject", fetchuser,
    [
        body("subject_code", "Enter subject code of length 7").isLength({ min: 7, max: 7 })
    ],
    async (req, res) => {
        // check for errors in input
        const errors = validationResult(req.query);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { subject_code } = req.query
        const { student_id } = req.user
        const resp = {}

        let sql = `select count(*) as total from attendance_tb where subject_code='${subject_code}' and student_id=${student_id}`
        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }

            if (result) {
                resp.total = result[0].total
                sql = `select count(present) as present from attendance_tb where subject_code='${subject_code}' and student_id=${student_id} and present=1`

                connection.query(sql, (err, result) => {
                    if (err) {
                        console.log(err.sqlMessage)
                        res.send({ success: false, err })
                        return
                    }

                    if (result) {
                        resp.present = result[0].present
                        resp.absent = resp.total - resp.present
                        res.send({ success: true, result: resp })
                    }
                })
            }
        })
    })



// api for getting the attendence details of student in all subject in particular month
// query: { subject_code, month }
// header: { authToken }
router.get("/student-attendance-all", fetchuser,
    async (req, res) => {
        // check for errors in input
        const errors = validationResult(req.query);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { student_id } = req.user

        let sql = `select present, date, subject_name from attendance_tb, subject_tb where student_id=${student_id} and attendance_tb.subject_code=subject_tb.subject_code order by date;`
        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }

            if (result.length > 0) {
                res.send({ success: true, result })
                return
            } else {
                res.send({ success: true, msg: "no attendance records found" })
                return
            }
        })
    })


// api for adding the attendence of the students
// headers: { auth-token }
// body: { subject_code, date, list of students } 

router.post("/add-attendence", fetchuser,
    [
        body("subject_code", "enter valid subject_code").isLength({ min: 7, max: 7 }),
        body("date", "enter valid date").isDate(),
    ],
    async (req, res) => {
        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { subject_code, date, students } = req.body
        const { teacher_id } = req.user

        let sql = `insert into attendance_tb(student_id, subject_code, teacher_id, date, present) values`

        for (let i = 0; i < students.length; i++) {
            const { student_id, present } = students[i]
            sql += `(${student_id}, '${subject_code}', ${teacher_id}, '${date}', ${present})`
            if (i != students.length - 1) sql += ", "
        }

        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
            }

            if (result) {
                console.log(result)
                res.send({ success: true, msg: "attendence added successfully" })
            }
        })
    })


// api for updating the attendance of the students by teacher
// headers: { auth-token }
// query: { subject_code, date }
// body: list of students

router.put("/update-attendance", fetchuser,
    [
        body("subject_code", "enter valid subject_code").isNumeric(),
        body("date", "enter valid date").isDate(),
    ],
    async (req, res) => {
        // check for errors in input
        const errors = validationResult(req.body);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { students, subject_code, date } = req.body
        const { teacher_id } = req.user

        students.forEach(student => {
            const { student_id, present } = student
            sql = `UPDATE attendance_tb SET present = ${present} WHERE student_id=${student_id} AND subject_code = "${subject_code}" AND teacher_id=${teacher_id} AND date = "${date}";`

            connection.query(sql, (err, result) => {
                if (err) {
                    console.log(err.sqlMessage)
                    res.send({ success: false, err })
                    return
                }

                // if (result) {
                //     console.log(result)
                //     // res.send({ success: true, result, msg: "Attendance updated successfully" })
                // } else {
                //     // res.send({ success: false, result, msg: "Attendance not updated" })
                // }
            })
        });

        res.send({ success: true, msg: "attendence updated successfully" })

    })


// api to get the attendance record for the students at particular date and class by teacher
// headers: { auth-token }
// query: { subject_code, date }
// body: list of students
router.post("/attendance-record", fetchuser,
    [
        body("subject_code", "Enter valid Subject Id").isLength({ min: 7, max: 7 }),
        // body("teacher_id", "Enter valid teacher id").isNumeric(),
        body("date", "Enter valid teacher id").isDate()
    ],
    async (req, res) => {
        const errors = validationResult(req.body);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { teacher_id } = req.user
        const { subject_code, date } = req.body

        let sql = `SELECT student_tb.student_id, student_regno, student_name, present FROM attendance_tb JOIN student_tb where attendance_tb.teacher_id=${teacher_id} AND subject_code="${subject_code}" AND date="${date}" AND student_tb.student_id = attendance_tb.student_id ORDER BY(student_regno); `

        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }

            if (result.length > 0) {
                res.send({ success: true, result, msg: "records fetched successfully" })
                return
            } else {
                res.send({ success: true, result, msg: "no records found" })
                return
            }
        })
    })


// get the dates when the attendance for particular subject was taken by a particular teacher
// headers: { auth-token }
// body: { subject_code }
router.post("/attendance-date", fetchuser,
    [
        body("subject_code", "enter valid subject code").isLength({ min: 7, max: 7 })
    ],
    async (req, res) => {
        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { subject_code } = req.body
        const { teacher_id } = req.user

        let sql = `select date from attendance_tb where subject_code="${subject_code}" and teacher_id=${teacher_id} group by date`
        connection.query(sql, (err, result) => {
            if (err) {
                console.log(err.sqlMessage)
                res.send({ success: false, err })
                return
            }

            if (result) {
                let dates = []
                for (let i = 0; i < result.length; i++) {
                    let dateTime = new Date(result[i].date)
                    let month = dateTime.getMonth() + 1
                    if (month <= 9) {
                        month = "0" + month
                    }
                    let date = dateTime.getFullYear() + "-" + month + "-" + dateTime.getDate()
                    dates[i] = date
                }

                res.send({ success: true, dates })
            }
        })
    })


// get the present and absent details of all the students of particular subject at given date
// headers: { auth-token }
// body: { subject_code, date }
router.post("/attendance-details", fetchuser,
    [
        body("subject_code", "enter valid subject code").isLength({ min: 7, max: 7 }),
        body("date", "Enter valid date").isLength({ min: 8, max: 10 })
    ],
    (req, res) => {
        // check for errors in input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { subject_code, date } = req.body
        const { teacher_id } = req.user
        const resp = {}

        let sql = `select count(*) as total from attendance_tb where subject_code="${subject_code}" and teacher_id=${teacher_id} and date="${date}"`

        connection.query(sql, (err, result) => {
            if (err) {
                res.send({ success: false, msg: err.sqlMessage })
            }

            if (result) {
                resp.total = result[0].total
                sql = `select count(*) as present from attendance_tb where subject_code="${subject_code}" and teacher_id=${teacher_id} and date="${date}" and present=1`

                connection.query(sql, (err, result) => {
                    if (err) {
                        res.send({ success: false, msg: err.sqlMessage })
                    }

                    if (result) {
                        resp.present = result[0].present
                        resp.absent = resp.total - resp.present
                        res.send({ success: true, result: resp })
                    }
                })
            }
        })
    })


// Export the module
module.exports = router;