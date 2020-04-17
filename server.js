'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT || 4000;
const app = express();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
const methodOverride = require('method-override');

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(methodOverride('_method'));

app.get('/', homePage);
app.get('/searches/new', mainForm);
app.post('/searches', searchBook);
app.post('/', saveInDataBase);
app.get('/details/:book', detailsPage);
app.put('/update/:book', updateInDataBase);
app.delete('/delete/:book', deleteBook);


function homePage(req, res) {
    let SQL = 'SELECT * FROM books;';
    client.query(SQL)
        .then(result => {
            res.render('pages/index', { data: result.rows });
        });
}

function mainForm(req, res) {
    res.render('pages/searches/new');
}

function searchBook(req, res) {
    let choice = req.body.choice;
    let select = req.body.select;
    let url = `https://www.googleapis.com/books/v1/volumes?q=in${select}:${choice}`;
    return superagent.get(url)
        .then(result => {
            let data = result.body.items;
            let array = data.map(val => {
                return new Book(val.volumeInfo);
            });
            res.render('pages/searches/show', { data: array });
        })
        .catch(error => {
            res.render('pages/error');
        });
}

function saveInDataBase(req, res) {
    let image = req.body.image;
    let title = req.body.title;
    let authors = req.body.authors;
    let description = req.body.description;
    let isbn = req.body.isbn;
    let bookshelf = req.body.bookshelf;
    if (!Array.isArray(authors)) {
        authors = [authors];
    }
    let SQL = 'INSERT INTO books (image, title,authors,description,isbn,bookshelf) VALUES ($1,$2,$3,$4,$5,$6);';
    let safeValues = [image, title, authors, description, isbn, bookshelf];
    return client.query(SQL, safeValues)
        .then(() => {
            res.redirect('/');
        });
}

function detailsPage(req, res) {
    let buttonClicked = req.params.book;
    let SQL = 'SELECT * FROM books WHERE id=$1;';
    let safeValues = [buttonClicked];
    return client.query(SQL, safeValues)
        .then(result => {
            let SQL2 = 'SELECT DISTINCT bookshelf FROM books;';
            client.query(SQL2)
                .then(bookshelf => {
                    res.render('details', { data: result.rows[0], book: bookshelf.rows });
                })
        });

}
function updateInDataBase(req, res) {
    let buttonClicked = req.params.book;
    let title = req.body.title;
    let image = req.body.image;
    let authors = req.body.authors;
    let isbn = req.body.isbn;
    let bookshelf = req.body.bookshelf;
    let description = req.body.description;
    if (!Array.isArray(authors)) {
        authors = [authors];
    }
    let SQL = 'UPDATE books SET title=$1,image=$2,authors=$3,ISBN=$4,bookshelf=$5,description=$6 WHERE id=$7;';
    let safeValues = [title, image, authors, isbn, bookshelf, description, buttonClicked];
    client.query(SQL, safeValues)
        .then(result => {
            detailsPage(req, res);
        });
}

function deleteBook(req, res) {
    let bookId = req.params.book;
    let SQL = 'DELETE FROM books WHERE id=$1;';
    let safeValues = [bookId];
    client.query(SQL, safeValues)
        .then(() => {
            homePage(req, res);
        }).catch(error => {
            console.log(error);
        });
}


function Book(data) {
    this.title = data.title || 'The Title';
    this.image = data.imageLinks.thumbnail || 'https://www.rd.com/wp-content/uploads/2017/10/This-Is-How-Long-It-Takes-To-Read-The-Whole-Dictionary_509582812-Billion-Photos_FB-e1574101045824.jpg';
    this.authors = data.authors || [];
    this.description = data.description || 'no description';
    this.bookshelf = data.categories || 'fill it';
    this.isbn = data.industryIdentifiers[0].type + ' ' + data.industryIdentifiers[0].identifier || 'no ISBN';
}

app.get('*', (req, res) => {
    res.render('pages/error');
});

client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`listen to ${PORT}`);
        });
    });