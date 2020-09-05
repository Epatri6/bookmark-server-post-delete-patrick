const BookmarksService = {
  getAllBookmarks(knex) {
    return knex('bookmarks').select('*');
  },

  getBookmark(knex, id) {
    return knex('bookmarks').select('*').where({ id }).first();
  },
};

module.exports = BookmarksService;
