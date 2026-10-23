import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const payload = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = payload;

  if (!userId || !teamId || !type || minutes === undefined || minutes === null) {
    throw Object.assign(new Error('userId, teamId, type, and minutes are required'), { status: 400 });
  }

  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
    throw Object.assign(new Error('userId must be a valid Mongo ObjectId'), { status: 400 });
  }

  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) {
    throw Object.assign(new Error('teamId must be a valid Mongo ObjectId'), { status: 400 });
  }

  const normalizedMinutes = typeof minutes === 'string' ? Number(minutes) : Number(minutes);
  if (!Number.isFinite(normalizedMinutes) || normalizedMinutes <= 0) {
    throw Object.assign(new Error('minutes must be a positive number'), { status: 400 });
  }

  const normalizedType = typeof type === 'string' ? type.trim() : '';
  if (!normalizedType) {
    throw Object.assign(new Error('type is required'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  if (!team) {
    throw Object.assign(new Error('Team not found'), { status: 404 });
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: normalizedType,
    minutes: normalizedMinutes,
    points: normalizedMinutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const payload = input as Record<string, unknown>;
  const { name, mascot, members } = payload;

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  const normalizedMembers = Array.isArray(members) ? members : [];
  const validMembers = normalizedMembers.map((memberId) => {
    if (typeof memberId !== 'string' || !mongoose.isValidObjectId(memberId)) {
      throw Object.assign(new Error('Team members must be valid Mongo ObjectIds'), { status: 400 });
    }
    return new mongoose.Types.ObjectId(memberId);
  });

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: validMembers,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
