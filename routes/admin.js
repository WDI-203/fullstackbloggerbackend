var express = require("express");
var router = express.Router();
const { blogsDB } = require("../mongo");

const updatePost = async (blogId, title, text, author) => {
  try {
    const collection = await blogsDB().collection("posts");
    const updatedPost = {
      title: title,
      text: text,
      author: author,
      lastModified: new Date(),
    };
    await collection.updateOne(
      {
        id: blogId,
      },
      {
        $set: {
          ...updatedPost,
        },
      }
    );
  } catch (e) {
    console.error(e);
  }
};

const deletePosts = async (blogIds) => {
  try {
    const collection = await blogsDB().collection("posts");
    await collection.deleteMany({
      id: {
        $in: blogIds,
      },
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const getList = async () => {
  try {
    const collection = await blogsDB().collection("posts");
    const dbResult = await collection
      .find({})
      .project({ text: false })
      .toArray();
    return dbResult;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

router.get("/blog-list", async (req, res) => {
  try {
    const blogList = await getList();
    res.status(200).json({
      message: blogList,
      success: true,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: String(e), success: false });
  }
});

const serverCheckBlogIsValid = (reqBody) => {
  if (
    !reqBody.hasOwnProperty("title") ||
    !typeof reqBody.title === "string" ||
    reqBody.title < 1
  ) {
    return { isValid: false, message: `input field title is not valid` };
  }

  if (
    !reqBody.hasOwnProperty("text") ||
    !typeof reqBody.text === "string" ||
    reqBody.text < 1
  ) {
    return { isValid: false, message: `input field text is not valid` };
  }

  if (
    !reqBody.hasOwnProperty("author") ||
    !typeof reqBody.author === "string" ||
    reqBody.author < 1
  ) {
    return { isValid: false, message: `input field author is not valid` };
  }

  return { isValid: true, message: "post is valid" };
};

router.put("/edit-blog", async function (req, res) {
  try {
    const blogId = req.body.blogId;
    const title = req.body.title;
    const author = req.body.author;
    const text = req.body.text;
    const today = new Date();

    const collection = await blogsDB().collection("posts");

    const originalBlog = await collection.findOne({ id: blogId });
    if (!originalBlog) {
      res
        .status(204)
        .json({ message: `blog with ${id} does not exist`, success: false });
      return;
    }

    const { isValid, message } = serverCheckBlogIsValid(req.body);
    if (!isValid) {
      res
        .status(400)
        .json({
          message: `inputted fields are not valid. Reason: ${message}`,
          success: false,
        });
      return;
    }

    const updatedPost = {
      title,
      author,
      text,
      lastModified: today,
    };

    await collection.updateOne(
      {
        id: blogId,
      },
      {
        $set: {
          ...updatedPost,
        },
      }
    );

    res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: String(e), success: false });
  }
});

router.delete("/delete-blog/:blogId", async (req, res) => {
  try {
    const blogId = Number(req.params.blogId);
    await deletePosts([blogId]);
    res.status(200).json({ message: `Blog: ${blogId} Deleted`, success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: String(e), success: false });
  }
});

module.exports = router;
