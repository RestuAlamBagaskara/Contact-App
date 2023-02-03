const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const { body, validationResult, check } = require('express-validator')
const methodOverride = require('method-override')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const flash = require('connect-flash')

require('./utils/db')
const Contact = require('./model/contact')

const app = express()
const port = 3000

// Setup method-override
app.use(methodOverride('_method'))

// Gunakan view engine EJS
app.set('view engine', 'ejs')

// Konfigurasi flash message
app.use(cookieParser('secret'))
app.use(session({
    cookie: {maxAge: 6000},
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))
app.use(flash())

// Middleware
app.use(expressLayouts);
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

// Halaman Home
app.get('/', (req, res) => {
    res.render('index', {
        layout: 'layouts/main-layout',
        title: 'Home'
    })
})

// Halaman About
app.get('/about', (req, res) => {
    res.render('about', {
        layout: 'layouts/main-layout',
        title: 'Halaman About',
    })
})

// Halaman Contact
app.get('/contact', async(req, res) => {
    const contacts = await Contact.find()
    res.render('contact', { 
        layout: 'layouts/main-layout',
        title: 'Halaman Contact',
        contacts,
        msg: req.flash('msg')
    })
})

// Halaman Tambah Contact
app.get('/contact/add', (req, res) => {
    res.render('add-contact', {
        title: "Form Tambah Contact",
        layout: 'layouts/main-layout'
    })
})

// Proses Tambah Data Contact
app.post('/contact', 
    [
        body('nama').custom(async (value) => {
            const duplikat = await Contact.findOne({nama: value})
            if(duplikat){
                throw new Error('Nama Contact sudah digunakan')
            }
            return true
        }),
        check('email', 'email tidak valid').isEmail(),
        check('nohp', 'No HP yang digunakan tidak valid').isMobilePhone('id-ID')
    ], 
    (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        res.render('add-contact', {
            title: "Form Tambah Contact",
            layout: 'layouts/main-layout',
            errors: errors.array()
        })
    } else {
        Contact.insertMany(req.body, () => {
            req.flash('msg', 'Contact berhasil ditambahkan')
            res.redirect('/contact')
        })
    }
})

// Hapus Contact
app.delete('/contact', async (req, res) => {
    Contact.deleteOne({nama: req.body.nama}).then(() => {
        req.flash('msg', 'Contact berhasil Dihapus')
        res.redirect('/contact')
    })
})

// Form Ubah data Contact
app.get('/contact/edit/:nama', async (req, res) => {
    const contact = await Contact.findOne({nama: req.params.nama})
    res.render('edit-contact', {
        title: "Form Edit Contact",
        layout: 'layouts/main-layout',
        contact
    })
})

// Proses Ubah data
app.put('/contact', 
    [
        body('nama').custom(async(value, { req }) => {
            const duplikat = await Contact.findOne({nama: value})
            if(value !== req.body.oldNama && duplikat){
                throw new Error('Nama Contact sudah digunakan')
            }
            return true
        }),
        check('email', 'email tidak valid').isEmail(),
        check('nohp', 'No HP yang digunakan tidak valid').isMobilePhone('id-ID')
    ], 
    (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        res.render('edit-contact', {
            title: "Form Edit Contact",
            layout: 'layouts/main-layout',
            errors: errors.array(),
            contact: req.body
        })
    } else {
        Contact.updateOne(
            {_id : req.body._id},
            {
                $set: {
                    nama: req.body.nama,
                    email: req.body.email,
                    nohp: req.body.nohp,
                }
            }
        ).then(() => {
            req.flash('msg', 'Contact berhasil diubah')
            res.redirect('/contact')
        })
    }
})

// Halaman Detail Contact
app.get('/contact/:nama', async (req, res) => {
    const contact = await Contact.findOne({nama: req.params.nama})
    res.render('detail', { 
        layout: 'layouts/main-layout',
        title: 'Halaman Detail Contact',
        contact
    })
})

app.listen(port, () => {
    console.log(`Mongo Contact App | Listen to http://localhost:${port}`)
})