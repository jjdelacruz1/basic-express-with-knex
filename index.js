const fs = require('fs')
const mustache = require('mustache')

const express = require('express')
const app = express()

const dbConfigs = require('./knexfile.js')
const db = require('knex')(dbConfigs.development)

const port = 3000

// -----------------------------------------------------------------------------
// Express.js Endpoints

const homepageTemplate = fs.readFileSync('./templates/homepage.mustache', 'utf8')
const cohortTemplate = fs.readFileSync('./templates/cohort.mustache', 'utf8')
const studentTemplate = fs.readFileSync('./templates/student.mustache', 'utf8')

app.use(express.urlencoded())

app.get('/', function (req, res) {
  getAllCohorts()
    .then(function (allCohorts) {
      res.send(mustache.render(homepageTemplate, { cohortsListHTML: renderAllCohorts(allCohorts) }))
    })
})

app.post('/cohorts', function (req, res) {
  createCohort(req.body)
    .then(function () {
      res.send('hopefully we created your cohort <a href="/">go home</a>')
    })
    .catch(function () {
      res.status(500).send('something went wrong. waaah, waaah')
    })
})

app.get('/cohorts/:slug', function (req, res) {
  getOneCohort(req.params.slug)
    .then(function (cohort) {
      res.send(mustache.render(cohortTemplate, { oneCohortHTML: singleCohort(cohort) }))
    })
    .catch(function (err) {
      res.status(404).send('cohort not found :(')
    })
})

app.get('/students', function (req, res) {
  getAllStudents()
    .then(function (allStudents) {
      res.send(mustache.render(studentTemplate, { studentsListHTML: renderAllStudents(allStudents) }))
    })
})

app.get('/students/:id', function (req, res) {
  getOneStudent(req.params.slug)
    .then(function (student) {
      res.send(mustache.render(studentTemplate, { oneStudentHTML: singleStudent(student)}))
    })
})

app.listen(port, function () {
  console.log('Listening on port ' + port + ' 👍')
})

// -----------------------------------------------------------------------------
// HTML Rendering

function renderCohort (cohort) {
  return `<li><a href="/cohorts/${cohort.slug}">${cohort.title}</a></li>`
}

function singleCohort (cohort) {
  return `<h1>${cohort.title}</h1>
          <h3>${cohort.startDate}</h3>
          <h3>${cohort.endDate}</h3>
          `
}

function renderAllCohorts (allCohorts) {
  return '<ul>' + allCohorts.map(renderCohort).join('') + '</ul>'
}

function renderStudent (student) {
  return `<li><a href="/student/${student.slug}">${student}</a></li>`
}

function renderAllStudents (allStudents) {
  return '<ul' + allStudents.map(renderStudent).join('') + '</ul>'
}

// -----------------------------------------------------------------------------
// Database Queries

const getAllCohortsQuery = `
  SELECT *
  FROM Cohorts
`

const getAllStudentsQuery = `
  SELECT *
  FROM Students
`

function getAllCohorts () {
  return db.raw(getAllCohortsQuery)
}

function getAllStudents () {
  return db.raw(getAllStudentsQuery)
}

function getOneCohort (slug) {
  return db.raw('SELECT * FROM Cohorts WHERE slug = ?', [slug])
    .then(function (results) {
      if (results.length !== 1) {
        throw null
      } else {
        return results[0]
      }
    })
}

function getOneStudent (slug) {
  return db.raw('SELECT * FROM Students WHERE slug = ?', [slug])
    .then(function (results) {
      return results[0]
    })
}

function createCohort (cohort) {
  return db.raw('INSERT INTO Cohorts (title, slug, isActive) VALUES (?, ?, true)', [cohort.title, cohort.slug])
}

// -----------------------------------------------------------------------------
// Misc

function prettyPrintJSON (x) {
  return JSON.stringify(x, null, 2)
}
