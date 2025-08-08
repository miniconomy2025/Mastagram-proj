import { type Request, type Response } from 'express';
import { Follow, Undo, type Recipient, isActor } from '@fedify/fedify';
import federation, { createContext, federatedHostname } from '../federation/federation.ts';
import { findUserByUsername } from '../queries/user.queries.ts';
import { cachedLookupObject, invalidateCache } from '../federation/lookup.ts';
import logger from '../logger.ts';
import { createFollowing, deleteFollowing, checkIfFollowing } from '../queries/following.queries.ts';
import { Temporal } from '@js-temporal/polyfill';

export class FollowController {
  static async followUser(req: Request, res: Response): Promise<Response> {
    const followerUsername = req.user?.username;
    const followingId = req.params.userId;

    if (!followerUsername) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!followingId) {
      return res.status(400).json({ message: 'User ID to follow is required' });
    }

    if (followerUsername === followingId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    try {
      const ctx = createContext(federation, req);
      const follower = await findUserByUsername(followerUsername);
      if (!follower) {
        return res.status(404).json({ message: 'Follower user not found' });
      }

      const followingActor = await cachedLookupObject(ctx, followingId);
      if (!followingActor || !isActor(followingActor) || !followingActor.inboxId || !followingActor.id?.href) {
        return res.status(404).json({ message: 'User to follow not found or is invalid' });
      }

      const alreadyFollowing = await checkIfFollowing(followerUsername, followingActor.id.href);
      if (alreadyFollowing) {
        return res.status(409).json({ message: 'Already following this user' });
      }

      const followActivity = new Follow({
        actor: ctx.getActorUri(followerUsername),
        object: followingActor,
      });

      await ctx.sendActivity({ username: followerUsername }, followingActor as Recipient, followActivity);
      logger.info(`Follow activity sent from ${followerUsername} to ${followingId}`);

      await invalidateCache(`@${follower.username}@${federatedHostname}`);
      await invalidateCache(followingActor.id.href);

      await createFollowing({
        followerUsername,
        actorId: followingActor.id.href,
        createdAt: Temporal.Now.instant().epochMilliseconds,
      });

      return res.status(200).json({ message: 'Follow request sent successfully' });
    } catch (error: any) {
      logger.error(`Failed to follow ${followingId} by ${followerUsername}:`, error);
      return res.status(500).json({ message: 'Failed to send follow request' });
    }
  }

  static async unfollowUser(req: Request, res: Response): Promise<Response> {
    const followerUsername = req.user?.username;
    const followingId = req.params.userId;

    if (!followerUsername) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!followingId) {
      return res.status(400).json({ message: 'User ID to unfollow is required' });
    }

    if (followerUsername === followingId) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }

    try {
      const ctx = createContext(federation, req);
      const follower = await findUserByUsername(followerUsername);
      if (!follower) {
        return res.status(404).json({ message: 'Follower user not found' });
      }

      const followingActor = await cachedLookupObject(ctx, followingId);
      if (!followingActor || !isActor(followingActor) || !followingActor.inboxId || !followingActor.id?.href) {
        return res.status(404).json({ message: 'User to unfollow not found or is invalid' });
      }

      const followActivity = new Follow({
        actor: ctx.getActorUri(followerUsername),
        object: followingActor,
      });

      const undoFollowActivity = new Undo({
        actor: ctx.getActorUri(followerUsername),
        object: followActivity,
      });

      await ctx.sendActivity({ username: followerUsername }, followingActor as Recipient, undoFollowActivity);
      logger.info(`Undo Follow activity sent from ${followerUsername} to ${followingId}`);

      await invalidateCache(`@${follower.username}@${federatedHostname}`);
      await invalidateCache(followingActor.id.href);

      await deleteFollowing(followingActor.id.href, followerUsername);

      return res.status(200).json({ message: 'Unfollow request sent successfully' });
    } catch (error: any) {
      logger.error(`Failed to unfollow ${followingId} by ${followerUsername}:`, error);
      return res.status(500).json({ message: 'Failed to send unfollow request' });
    }
  }
}
