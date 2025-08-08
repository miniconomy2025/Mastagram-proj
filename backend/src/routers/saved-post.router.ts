import { Router } from "express";
import { esClient } from "../configs/elasticsearch.ts";
import logger from "../logger.ts";
import { ensureAuthenticated } from "../configs/passport.config.ts";

const savedPostsRouter = Router();

// Save a post
savedPostsRouter.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { post } = req.body;
    const username = req.user?.username;
    

    if (!username || !post || !post.id) {
      return res.status(400).json({ 
        error: 'username and complete post data are required' 
      });
    }

    // Check if already saved
    const existingSave = await esClient.search({
      index: 'user-saved-posts',
      query: {
        bool: {
          must: [
            { term: { userId: username } },
            { nested: {
              path: "post",
              query: {
                term: { "post.id": post.id }
              }
            }}
          ]
        }
      }
    });

    if (existingSave.hits.hits.length > 0) {
      return res.status(409).json({ error: 'Post already saved' });
    }

    // Save the post
    await esClient.index({
      index: 'user-saved-posts',
      document: {
        userId: username,
        post,
        savedAt: new Date().toISOString()
      }
    });

    return res.status(201).json({ 
      message: 'Post saved successfully',
      saved: true
    });
  } catch (error) {
    logger.error(`Error saving post: ${error}`);
    return res.status(500).json({ error: 'Failed to save post' });
  }
});

// Unsave a post
savedPostsRouter.delete('/:postId', ensureAuthenticated, async (req, res) => {
  try {
    const { postId } = req.params;
    const username = req.user?.username;

    if (!username || !postId) {
      return res.status(400).json({ 
        error: 'username and postId are required' 
      });
    }

    // Find and delete the saved post
    const searchResponse = await esClient.search({
      index: 'user-saved-posts',
      query: {
        bool: {
          must: [
            { term: { userId: username } },
            { nested: {
              path: "post",
              query: {
                term: { "post.id": postId }
              }
            }}
          ]
        }
      }
    });

    if (searchResponse.hits.hits.length === 0) {
      return res.status(404).json({ error: 'Saved post not found' });
    }

    const savedPostId: string = searchResponse.hits.hits[0]._id!;

    await esClient.delete({
      index: 'user-saved-posts',
      id: savedPostId
    });

    return res.json({ 
      message: 'Post unsaved successfully',
      saved: false
    });
  } catch (error) {
    logger.error(`Error unsaving post: ${error}`);
    return res.status(500).json({ error: 'Failed to unsave post' });
  }
});

// Get saved posts for a user
savedPostsRouter.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const username = req.user?.username;
    const { page = 1, limit = 20 } = req.query;

    const from = (Number(page) - 1) * Number(limit);

    const response: any = await esClient.search({
      index: 'user-saved-posts',
      from,
      size: Number(limit),
      query: {
        term: { userId: username }
      },
      sort: [
        { savedAt: { order: 'desc' } }
      ]
    });

    const savedPosts = response.hits.hits.map((hit: any) => ({
      ...hit._source.post,
      savedAt: hit._source.savedAt
    }));

    const total = response.hits.total.value;

    return res.json({
      items: savedPosts,
      total,
      page: Number(page),
      limit: Number(limit),
      hasMore: from + Number(limit) < total
    });
  } catch (error) {
    logger.error(`Error fetching saved posts: ${error}`);
    return res.status(500).json({ error: 'Failed to fetch saved posts' });
  }
});

// Check if post is saved by a user
savedPostsRouter.get('/:postId', ensureAuthenticated, async (req, res) => {
  try {
    const { postId } = req.params;
    const username = req.user?.username;

    const response: any = await esClient.search({
      index: 'user-saved-posts',
      query: {
        bool: {
          must: [
            { term: { userId: username } },
            { nested: {
              path: "post",
              query: {
                term: { "post.id": postId }
              }
            }}
          ]
        }
      }
    });

    return res.json({
      isSaved: response.hits.hits.length > 0,
      savedAt: response.hits.hits[0]?._source?.savedAt
    });
  } catch (error) {
    logger.error(`Error checking saved status: ${error}`);
    return res.status(500).json({ error: 'Failed to check saved status' });
  }
});

export default savedPostsRouter;