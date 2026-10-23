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
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$team.name', totalPoints: 1 } },
  ]);

  return totals.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = userEmail.trim().toLowerCase();
  const user = await User.findOne({ email }).lean();

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const activityTypes = recentActivities.map((activity) => activity.type).filter((type): type is string => Boolean(type));
  const focusCandidates = new Set<string>();

  if (typeof user.fitnessGoal === 'string' && user.fitnessGoal.trim()) {
    focusCandidates.add(user.fitnessGoal.trim().toLowerCase());
  }

  for (const activityType of activityTypes) {
    focusCandidates.add(activityType.trim().toLowerCase());
  }

  const workoutQuery = focusCandidates.size > 0 ? { focus: { $in: Array.from(focusCandidates) } } : {};
  const workouts = await Workout.find(workoutQuery).lean();

  if (workouts.length === 0) {
    return [];
  }

  const primaryType = activityTypes[0] ?? user.fitnessGoal ?? 'activity';
  const primaryFocus = user.fitnessGoal?.trim().toLowerCase() || primaryType.toLowerCase();

  return workouts
    .map((workout) => ({
      ...workout,
      reason: `Based on your ${primaryFocus} goal and recent ${primaryType} activity, this workout fits your current pattern.`,
    }))
    .sort((left, right) => {
      const leftScore = left.focus === primaryFocus ? 1 : 0;
      const rightScore = right.focus === primaryFocus ? 1 : 0;
      return rightScore - leftScore;
    });
}

export { User };
