const knex = require('knex');
const supertest = require('supertest');

const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');
const { expect } = require('chai');


describe('Bookmarks Endpoints', () => {
  let db;
  before('Make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  before('Clean the table', () => db('bookmarks').truncate());
  afterEach(() => db('bookmarks').truncate());

  after('Clean up', () => db.destroy());

  context('Given "bookmarks" has no data', () => {
    it('Get /bookmarks should return an empty array', () => {
      return supertest(app)
        .get('/bookmarks')
        .set({ Authorization: `Bearer ${process.env.API_TOKEN}` })
        .expect(200, []);
    });

    it('Get /bookmarks/:id should return 404', () => {
      return supertest(app)
        .get('/bookmarks/1')
        .set({ Authorization: `Bearer ${process.env.API_TOKEN}` })
        .expect(404, {'message': 'Bookmark not found'});
    });

    it('Creates a new bookmark', () => {
      const newData = {
        title: 'Rawrrawr',
        url: 'https://google.com',
        description: 'eh',
        rating: 3
      }
      const expected = {
        ...newData,
        rating: '3',
        id: 1
      }
      return supertest(app)
      .post('/bookmarks')
      .set({Authorization: `Bearer ${process.env.API_TOKEN}`})
      .send(newData)
      .expect(201)
      .expect(res => {
        expect(res.headers.location).to.eql(`/bookmarks/${expected.id}`)
        expect(res.body).to.eql(expected);
        return supertest(app).get(`/bookmarks/${res.id}`).expect(expected);
      });
    });

    const fields = ['title', 'url', 'rating'];
    const newData = {
      title: 'Facebook',
      url: 'https://facebook.com',
      rating: 3
    }
    fields.forEach(field => {
      it(`fails to create bookmark with invalid ${field}`, () => {
        const testData = {
          ...newData
        };
        testData[field] = '';
        return supertest(app).post('/bookmarks')
        .set({Authorization: `Bearer ${process.env.API_TOKEN}`})
        .send(testData)
        .expect(400);
      })
    })
  });

  context('Given "bookmarks" has data in the table', () => {
    const testBookmarks = makeBookmarksArray();

    beforeEach(() => db('bookmarks').insert(testBookmarks));

    it('GET /bookmarks returns 200 status and all bookmarks', () => {
      return supertest(app)
        .get('/bookmarks')
        .set({ Authorization: `Bearer ${process.env.API_TOKEN}` })
        .expect(200, testBookmarks);
    });

    it('Get /bookmarks/:id should return first bookmark', () => {
      const id = 1;
      return supertest(app)
        .get(`/bookmarks/${id}`)
        .set({ Authorization: `Bearer ${process.env.API_TOKEN}` })
        .expect(200, testBookmarks[id - 1])
    });

    it('fails to delete non existant bookmark', () => {
      const id = 15;
      return supertest(app).delete(`/bookmarks/${id}`)
      .set({Authorization: `Bearer ${process.env.API_TOKEN}`})
      .expect(404, {message: 'Bookmark not found'});
    })

    it('deletes a bookmark', () => {
      const id = 1;
      return supertest(app).delete(`/bookmarks/${id}`)
      .set({Authorization: `Bearer ${process.env.API_TOKEN}`})
      .expect(204);
    });
  });
});
