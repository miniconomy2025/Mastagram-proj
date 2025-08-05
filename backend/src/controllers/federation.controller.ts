import logger from '../logger.ts';
import federation, { createContext } from '../federation/federation.ts';
import { getFederatedUserCollection } from '../services/federation.service.ts';
import type { FederatedUserList, PaginatedResponse } from '../types/federation.types.ts';
import type { Request, Response } from 'express';


export async function getFollowers(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const page = req.query.page?.toString();
  
  logger.info(`Fetching followers for ${userId}`);

  try {
    const ctx = createContext(federation, req);
    const collectionData = await getFederatedUserCollection(ctx, userId, 'followers', page);

    const response: PaginatedResponse<FederatedUserList> = {
      items: collectionData.items,
      total: collectionData.total,
      next: collectionData.next,
    };

    res.json(response);
  } catch (error: any) {
    logger.error(`Error fetching followers for ${userId}: ${error.message}`);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}


export async function getFollowing(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const page = req.query.page?.toString();

  logger.info(`Fetching following for ${userId}`);

  try {
    const ctx = createContext(federation, req);
    const collectionData = await getFederatedUserCollection(ctx, userId, 'following', page);
    
    const response: PaginatedResponse<FederatedUserList> = {
      items: collectionData.items,
      total: collectionData.total,
      next: collectionData.next,
    };

    res.json(response);
  } catch (error: any) {
    logger.error(`Error fetching following for ${userId}: ${error.message}`);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}