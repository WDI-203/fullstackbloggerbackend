var express = require("express");
var router = express.Router();
const { uuid } = require('uuidv4');

const { blogsDB } = require("../mongo");

const findPost = async (blogId) => {
  try {
    const collection = await blogsDB().collection("posts");
    return await collection.findOne({ id: blogId });
  } catch (e) {
    console.error(e);
  }
};

const getPosts = async (
  limit,
  skip,
  sortField,
  sortOrder,
  filterField,
  filterValue,
  searchParam
) => {
  try {
    const collection = await blogsDB().collection("posts");

    //Validation
    let dbLimit = limit;
    if (!limit) {
      dbLimit = 100;
    }

    let dbSkip = skip;
    if (!skip) {
      dbSkip = 0;
    }

    const sortParams = {};
    if (sortField && sortOrder) {
      let convertedSortOrder = 1;
      if (sortOrder.toLowerCase() === "asc") {
        convertedSortOrder = 1;
      }
      if (sortOrder.toLowerCase() === "desc") {
        convertedSortOrder = -1;
      }
      sortParams[sortField] = convertedSortOrder;
    }

    const filterParams = {};
    if (filterField && filterValue) {
      filterParams[filterField] = filterValue;
    }

    if (searchParam) {
      filterParams["text"] = {
        $regex: `^${searchParam}*`,
      };
    }

    const dbResult = await collection
      .find(filterParams)
      .limit(dbLimit)
      .skip(dbSkip)
      .sort(sortParams)
      .toArray();

    return dbResult;
  } catch (e) {
    console.error(e);
    return e;
  }
};

const getAuthors = async () => {
  try {
    const collection = await blogsDB().collection("posts");
    const posts = await collection.distinct("author");
    const authors = posts.filter((author) => {
      return !!author;
    });
    return authors;
  } catch (e) {
    console.error(e);
  }
};

const getPostsCollectionLength = async () => {
  try {
    const collection = await blogsDB().collection("posts");
    return await collection.count();
  } catch (e) {
    console.error(e);
  }
};

const makePost = async (newPost) => {
  try {
    const collection = await blogsDB().collection("posts");
    await collection.insertOne(newPost);
  } catch (e) {
    console.error(e);
  }
};

router.get("/all-blogs", async function (req, res, next) {
  const limit = Number(req.query.limit);
  const skip = Number(req.query.limit) * (Number(req.query.page) - 1)
  const sortField = req.query.sortField;
  const sortOrder = req.query.sortOrder;
  const filterField = req.query.filterField;
  const filterValue = req.query.filterValue;
  const searchParam = req.query.searchParam;

  const allBlogs = await getPosts(
    limit,
    skip,
    sortField,
    sortOrder,
    filterField,
    filterValue,
    searchParam
  );
  res.json({ message: allBlogs });
});

router.get("/single-blog/:blogId", async function (req, res, next) {
  const blogId = Number(req.params.blogId);
  const blogPost = await findPost(blogId);
  res.json(blogPost);
});

router.post("/blog-submit", async function (req, res, next) {
  try {
    const title = req.body.title;
    const text = req.body.text;
    const author = req.body.author;

    const collectionLength = await getPostsCollectionLength();

    const newPost = {
      title,
      text,
      author,
      createdAt: new Date(),
      id: uuid(),
      lastModified: new Date(),
    };

    await makePost(newPost)
    res.status(200).json({ message: "New blog submitted", success: true, payload: newPost });
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: e, success: false });
  }
});

module.exports = router;
