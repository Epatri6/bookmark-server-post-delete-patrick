const knex = require('knex');
const supertest = require('supertest');

const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');


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
  });
});
