import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { Station, UserRole } from '../../types';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Lazy-load Firestore to avoid initialization issues
const getDb = () => admin.firestore();

// Initialize stations with seed data (MUST be before /:id routes)
router.post('/seed', authMiddleware, roleMiddleware([UserRole.ADMIN]), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { stations } = req.body;

    if (!stations || !Array.isArray(stations)) {
      res.status(400).json({ error: 'stations array is required' });
      return;
    }

    const batch = db.batch();

    for (const station of stations) {
      const ref = db.collection('stations').doc(station.id);
      batch.set(ref, station);
    }

    await batch.commit();

    res.json({ success: true, count: stations.length });
  } catch (error) {
    console.error('Error seeding stations:', error);
    res.status(500).json({ error: 'Failed to seed stations' });
  }
});

// Helper to transform Firestore GeoPoint to lat/lng
const transformStation = (doc: admin.firestore.DocumentSnapshot): Station => {
  const data = doc.data();
  if (!data) throw new Error('Station data is undefined');

  // Handle GeoPoint conversion
  let lat = data.lat;
  let lng = data.lng;

  if (data.location) {
    // If location is a GeoPoint or has _latitude/_longitude
    if (data.location._latitude !== undefined) {
      lat = data.location._latitude;
      lng = data.location._longitude;
    } else if (data.location.latitude !== undefined) {
      lat = data.location.latitude;
      lng = data.location.longitude;
    }
  }

  return {
    id: doc.id,
    ...data,
    lat,
    lng,
  } as Station;
};

// GET all stations
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const snapshot = await db.collection('stations').get();
    const stations: Station[] = [];

    snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      stations.push(transformStation(doc));
    });

    res.json(stations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

// GET single station by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection('stations').doc(req.params.id).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Station not found' });
      return;
    }

    res.json(transformStation(doc));
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({ error: 'Failed to fetch station' });
  }
});

// GET station members by ID
router.get('/:id/users', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const doc = await db.collection('stations').doc(req.params.id).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Station not found' });
      return;
    }

    const station = doc.data() as Station;
    res.json({
      ownerIds: station.managers ?? [],
      volunteerIds: station.volunteers ?? [],
    });
  } catch (error) {
    console.error('Error fetching station members:', error);
    res.status(500).json({ error: 'Failed to fetch station members' });
  }
});

import { validateStation } from '../middleware/validationMiddleware';
// POST create new station
router.post('/', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.STATION_MANAGER]), validateStation, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const stationData: Omit<Station, 'id'> = {
      ...req.body,
      lastUpdated: Date.now(),
      upvotes: 0,
      downvotes: 0
    };

    const docRef = await db.collection('stations').add(stationData);

    res.status(201).json({ id: docRef.id, ...stationData });
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({ error: 'Failed to create station' });
  }
});

// PUT update station
router.put('/:id', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.STATION_MANAGER]), validateStation, async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const stationRef = db.collection('stations').doc(req.params.id);
    const { lastUpdated: clientLastUpdated, ...updatePayload } = req.body;

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(stationRef);
      if (!doc.exists) {
        throw new Error('Station not found');
      }

      const serverLastUpdated = doc.data()?.lastUpdated;
      if (serverLastUpdated !== clientLastUpdated) {
        throw new Error('Conflict: Station has been updated by someone else.');
      }

      const newUpdateData = {
        ...updatePayload,
        lastUpdated: Date.now(),
      };
      transaction.update(stationRef, newUpdateData);
    });

    res.json({ id: req.params.id, ...updatePayload, lastUpdated: Date.now() });

  } catch (error: any) {
    console.error('Error updating station:', error);
    if (error.message.includes('Conflict')) {
      res.status(409).json({ error: error.message });
    } else if (error.message.includes('Not found')) {
      res.status(404).json({ error: 'Station not found' });
    } else {
      res.status(500).json({ error: 'Failed to update station' });
    }
  }
});

// DELETE station
router.delete('/:id', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.STATION_MANAGER]), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    await db.collection('stations').doc(req.params.id).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting station:', error);
    res.status(500).json({ error: 'Failed to delete station' });
  }
});

// DELETE a specific offering from a station
router.delete('/:id/offerings/:offering', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.STATION_MANAGER]), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const stationRef = db.collection('stations').doc(req.params.id);
    const doc = await stationRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Station not found' });
      return;
    }

    const offeringToRemove = req.params.offering;
    await stationRef.update({
      offerings: admin.firestore.FieldValue.arrayRemove(offeringToRemove)
    });

    // Also remove the item from the offering_categories collection
    const categoriesRef = db.collection('offering_categories');
    const snapshot = await categoriesRef.where('items', 'array-contains', offeringToRemove).get();
    if (!snapshot.empty) {
      snapshot.forEach(async (categoryDoc) => {
        await categoriesRef.doc(categoryDoc.id).update({
          items: admin.firestore.FieldValue.arrayRemove(offeringToRemove),
        });
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting offering from station:', error);
    res.status(500).json({ error: 'Failed to delete offering' });
  }
});

// DELETE a specific need from a station
router.delete('/:id/needs/:need', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.STATION_MANAGER]), async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const stationRef = db.collection('stations').doc(req.params.id);
    const doc = await stationRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Station not found' });
      return;
    }

    const needToRemove = req.params.need;
    const stationData = doc.data() as Station;
    const updatedNeeds = stationData.needs.filter(need => need.item !== needToRemove);

    await stationRef.update({
      needs: updatedNeeds
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting need from station:', error);
    res.status(500).json({ error: 'Failed to delete need' });
  }
});

// POST vote on station (upvote/downvote)
router.post('/:id/vote', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { userId, voteType, userRole } = req.body;
    const stationId = req.params.id;

    // Calculate vote weight based on role
    let weight = 1;
    if (userRole === UserRole.ADMIN) weight = 100;
    if (userRole === UserRole.STATION_MANAGER) weight = 10;

    const stationRef = db.collection('stations').doc(stationId);
    const voteRef = db.collection('votes').doc(`${userId}_${stationId}`);

    await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const stationDoc = await transaction.get(stationRef);
      const voteDoc = await transaction.get(voteRef);

      if (!stationDoc.exists) {
        throw new Error('Station not found');
      }

      const station = stationDoc.data() as Station;
      const previousVote = voteDoc.exists ? voteDoc.data()?.voteType : null;

      let upvoteDelta = 0;
      let downvoteDelta = 0;

      if (voteType === 'UP') {
        if (previousVote === 'UP') {
          upvoteDelta = -weight;
          transaction.delete(voteRef);
        } else if (previousVote === 'DOWN') {
          downvoteDelta = -weight;
          upvoteDelta = weight;
          transaction.update(voteRef, { voteType: 'UP', updatedAt: Date.now() });
        } else {
          upvoteDelta = weight;
          transaction.set(voteRef, {
            stationId,
            userId,
            voteType: 'UP',
            userRole,
            createdAt: Date.now()
          });
        }
      } else {
        if (previousVote === 'DOWN') {
          downvoteDelta = -weight;
          transaction.delete(voteRef);
        } else if (previousVote === 'UP') {
          upvoteDelta = -weight;
          downvoteDelta = weight;
          transaction.update(voteRef, { voteType: 'DOWN', updatedAt: Date.now() });
        } else {
          downvoteDelta = weight;
          transaction.set(voteRef, {
            stationId,
            userId,
            voteType: 'DOWN',
            userRole,
            createdAt: Date.now()
          });
        }
      }

      const updates: Record<string, unknown> = {
        upvotes: Math.max(0, (station.upvotes || 0) + upvoteDelta),
        downvotes: Math.max(0, (station.downvotes || 0) + downvoteDelta)
      };

      if (voteType === 'UP' && (userRole === UserRole.ADMIN || userRole === UserRole.STATION_MANAGER)) {
        updates.lastVerified = Date.now();
        updates.verification = {
          isVerified: true,
          verifiedBy: userRole === 'ADMIN' ? 'ADMIN' : 'OFFICIAL',
          verifiedAt: Date.now()
        };
      }

      transaction.update(stationRef, updates);
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error voting on station:', error);
    res.status(500).json({ error: 'Failed to vote on station' });
  }
});

import { AuthenticatedRequest } from '../middleware/authMiddleware';

// POST add a user to a station (owner/volunteer)
router.post('/:id/users', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.STATION_MANAGER]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const { email, role } = req.body; // role: 'owner' or 'volunteer'
    const stationId = req.params.id;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!email || !role || !['owner', 'volunteer'].includes(role)) {
      return res.status(400).json({ error: 'Valid email and role are required' });
    }

    // Find the user by email to get their UID
    const userRecord = await admin.auth().getUserByEmail(email).catch(() => null);
    if (!userRecord) {
      return res.status(404).json({ error: `User with email ${email} not found.` });
    }
    const userId = userRecord.uid;

    const stationRef = db.collection('stations').doc(stationId);
    const userRoleRef = db.collection('roles').doc(userId);

    await db.runTransaction(async (transaction) => {
      const stationDoc = await transaction.get(stationRef);
      if (!stationDoc.exists) {
        throw new Error('Station not found');
      }

      const station = stationDoc.data() as Station;
      const isManager = station.managers && station.managers.includes(currentUser.email);
      const isAdmin = currentUser.role === 'ADMIN';

      if (!isAdmin && !isManager) {
        throw new Error('Forbidden: Only admins or station managers can add users.');
      }
      if (role === 'owner' && isManager && !isAdmin) {
        throw new Error('Forbidden: Station managers cannot add other managers.');
      }

      // Update station document
      const fieldToUpdate = role === 'owner' ? 'managers' : 'volunteers';
      transaction.update(stationRef, {
        [fieldToUpdate]: admin.firestore.FieldValue.arrayUnion(email),
      });

      // Update user's global role only if they are being added as an owner
      if (role === 'owner') {
        const newRole = UserRole.STATION_MANAGER;
        const userRoleDoc = await transaction.get(userRoleRef);

        if (!userRoleDoc.exists) {
          // If the user has no role, set it.
          transaction.set(userRoleRef, { role: newRole });
        } else {
          // If the user has a role, only upgrade it. Never downgrade.
          const currentRole = userRoleDoc.data()?.role as UserRole;
          const roleHierarchy = [UserRole.RESIDENT, UserRole.VOLUNTEER, UserRole.STATION_MANAGER, UserRole.ADMIN];
          if (roleHierarchy.indexOf(newRole) > roleHierarchy.indexOf(currentRole)) {
            transaction.update(userRoleRef, { role: newRole });
          }
        }
      }
    });

    return res.json({ success: true, message: `User ${email} added as ${role} to station ${stationId} and role updated.` });

  } catch (error: any) {
    console.error('Error adding user to station:', error);
    if (error.message.includes('Forbidden')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to add user to station' });
  }
});

// DELETE a user from a station
router.delete('/:id/users', authMiddleware, roleMiddleware([UserRole.ADMIN, UserRole.STATION_MANAGER]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const { email, role } = req.body; // role: 'owner' or 'volunteer'
    const stationId = req.params.id;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!email || !role || !['owner', 'volunteer'].includes(role)) {
      return res.status(400).json({ error: 'Valid email and role are required' });
    }

    const userRecord = await admin.auth().getUserByEmail(email).catch(() => null);
    if (!userRecord) {
      return res.status(404).json({ error: `User with email ${email} not found.` });
    }
    const userId = userRecord.uid;

    const stationRef = db.collection('stations').doc(stationId);
    const userRoleRef = db.collection('roles').doc(userId);
    const stationsCollection = db.collection('stations');

    await db.runTransaction(async (transaction) => {
      const stationDoc = await transaction.get(stationRef);
      if (!stationDoc.exists) {
        throw new Error('Station not found');
      }

      const station = stationDoc.data() as Station;
      const isManagerOnThisStation = station.managers && station.managers.includes(currentUser.email);
      const isAdmin = currentUser.role === 'ADMIN';

      if (!isAdmin && !isManagerOnThisStation) {
        throw new Error('Forbidden: Only admins or station managers can perform this action.');
      }
      if (role === 'owner' && isManagerOnThisStation && !isAdmin) {
        throw new Error('Forbidden: Station managers cannot remove other managers.');
      }
      if (role === 'owner' && email === currentUser.email && station.managers && station.managers.length === 1 && !isAdmin) {
        throw new Error('Forbidden: You cannot remove yourself as the last manager.');
      }

      // Update station: remove user
      const fieldToUpdate = role === 'owner' ? 'managers' : 'volunteers';
      transaction.update(stationRef, {
        [fieldToUpdate]: admin.firestore.FieldValue.arrayRemove(email),
      });

      // Role demotion logic
      const userRoleDoc = await transaction.get(userRoleRef);
      const currentRole = userRoleDoc.exists ? userRoleDoc.data()?.role as UserRole : UserRole.RESIDENT;

      if (currentRole === UserRole.ADMIN) { // Admins are not demoted
        return;
      }

      // Check if user is manager or volunteer in OTHER stations
      const otherStationsQuery = await stationsCollection.where(fieldToUpdate, 'array-contains', email).get();
      const isMemberElsewhere = otherStationsQuery.docs.some(doc => doc.id !== stationId);

      // Only perform role demotion for owner/manager
      if (role === 'owner' && !isMemberElsewhere && currentRole === UserRole.STATION_MANAGER) {
        transaction.update(userRoleRef, { role: UserRole.VOLUNTEER });
      }
    });

    return res.json({ success: true, message: `User ${email} removed from ${role}s of station ${stationId} and roles updated if necessary.` });

  } catch (error: any) {
    console.error('Error removing user from station:', error);
    if (error.message.includes('Forbidden')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to remove user from station' });
  }
});

export { router as stationsRouter };
